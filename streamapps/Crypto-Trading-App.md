# Stream App Definition

```js

@App:name("Crypto-Trading-App")
@App:description("Crypto Trading demo")
@App:qlVersion('2')

-- The trigger
CREATE TRIGGER CryptoTraderEventsTrigger WITH ( interval = 5 sec );

/*
This app reads every 5 seconds the close prices FROM Coinbase, Bitstamp and Bitflyer exchanges APIs.
Then it calculates the average prices within 10 events window and creates a "BUY/SELL" trading strategy.
The close and average prices are stored in CryptoTraderQuotesAvgXXX streams 
whereas the strategy is kept in trades collection.
*/

/**
Testing the Stream Application:
    1. Publish the app
       
    2. Start the GUI against the same federation
*/

-- Streams for the http call requests
-------------------------------------------------------------------------------------------------------------------------------------

CREATE SINK UsdCryptoTraderRequestStream WITH (type='http-call', publisher.url='https://api.pro.coinbase.com/products/btc-usd/ticker', method='GET', headers="'User-Agent:c8cep'", sink.id='coinbase-ticker', map.type='json') (triggered_time string);

CREATE SINK EurCryptoTraderRequestStream WITH (type='http-call', publisher.url='https://www.bitstamp.net/api/v2/ticker/btceur', method='GET', sink.id='bitstamp-ticker', map.type='json') (triggered_time string);

CREATE SINK JpyCryptoTraderRequestStream WITH (type='http-call', publisher.url='https://api.bitflyer.com/v1/ticker', method='GET', sink.id='bitflyer-ticker', map.type='json') (triggered_time string);

-- Streams for the http call responses
-------------------------------------------------------------------------------------------------------------------------------------

CREATE SOURCE UsdCryptoTraderTickerResponseStream WITH (type='http-call-response', sink.id='coinbase-ticker', http.status.code='200', map.type='json', map.enclosing.element='$.*') (time string, price string);

CREATE SOURCE EurCryptoTraderTickerResponseStream WITH (type='http-call-response', sink.id='bitstamp-ticker', http.status.code='200', map.type='json') (timestamp string, last string);

CREATE SOURCE JpyCryptoTraderTickerResponseStream WITH (type='http-call-response', sink.id='bitflyer-ticker', http.status.code='200', map.type='json') (timestamp string, ltp double);

-- Streams for the close and average prices
-------------------------------------------------------------------------------------------------------------------------------------
CREATE SINK STREAM GLOBAL CryptoTraderQuotesAvgUSDNew(exchange string, quote_region string, symbol string, ma double, close double, timestamp long);

CREATE SINK STREAM GLOBAL CryptoTraderQuotesAvgEURNew(exchange string, quote_region string, symbol string, ma double, close double, timestamp long);

CREATE SINK STREAM GLOBAL CryptoTraderQuotesAvgJPYNew(exchange string, quote_region string, symbol string, ma double, close double, timestamp long);

CREATE SINK TradesBuy WITH (type="logger", prefix='BUY') (exchange string, quote_region string, symbol string, timestamp long, trade_location string,
                          trade_price double, trade_strategy string, trade_type string);

CREATE SINK TradesSell WITH (type="logger", prefix='SELL') (exchange string, quote_region string, symbol string, timestamp long, trade_location string,
                          trade_price double, trade_strategy string, trade_type string);                      

-- Common trades store
CREATE TABLE GLOBAL trades(exchange string, quote_region string, symbol string, timestamp long, trade_location string,
               