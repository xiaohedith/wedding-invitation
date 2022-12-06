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

CREATE SINK UsdCryptoTraderRequestStream WITH (type='http-