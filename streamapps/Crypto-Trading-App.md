# Stream App Definition

```js

@App:name("Crypto-Trading-App")
@App:description("Crypto Trading demo")
@App:qlVersion('2')

-- The trigger
CREATE TRIGGER CryptoTraderEventsTrigger WITH ( interval = 5 sec );

/*
This app reads every 5 seconds the close prices FROM Coinbase, Bitstamp an