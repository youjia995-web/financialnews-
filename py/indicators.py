import sys
import json
import pandas as pd
import numpy as np
import talib

def main():
    # Read data from stdin
    input_str = sys.stdin.read()
    if not input_str:
        return

    data = json.loads(input_str)
    if not data or len(data) == 0:
        print(json.dumps({"error": "No data"}))
        return

    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Ensure correct types
    df['trade_date'] = pd.to_datetime(df['trade_date'], format='%Y%m%d')
    df.sort_values('trade_date', inplace=True)
    df.reset_index(drop=True, inplace=True)
    
    close = df['close'].values
    high = df['high'].values
    low = df['low'].values
    volume = df['vol'].values

    # --- Technical Indicators ---
    
    # Moving Averages
    df['MA5'] = talib.SMA(close, timeperiod=5)
    df['MA20'] = talib.SMA(close, timeperiod=20)
    df['MA60'] = talib.SMA(close, timeperiod=60)
    
    # MACD
    df['MACD'], df['MACD_SIGNAL'], df['MACD_HIST'] = talib.MACD(close, fastperiod=12, slowperiod=26, signalperiod=9)
    
    # RSI
    df['RSI'] = talib.RSI(close, timeperiod=14)
    
    # KDJ (Stochastic)
    # TA-Lib STOCH returns slowk, slowd. Fastk is not directly exposed as 'KDJ', but we can approximate.
    # Usual KDJ in China: 9,3,3. 
    slowk, slowd = talib.STOCH(high, low, close, 
                               fastk_period=9, slowk_period=3, slowk_matype=0, 
                               slowd_period=3, slowd_matype=0)
    df['K'] = slowk
    df['D'] = slowd
    df['J'] = 3 * slowk - 2 * slowd
    
    # Bollinger Bands
    df['BB_UPPER'], df['BB_MIDDLE'], df['BB_LOWER'] = talib.BBANDS(close, timeperiod=20, nbdevup=2, nbdevdn=2, matype=0)
    
    # ATR
    df['ATR'] = talib.ATR(high, low, close, timeperiod=14)
    
    # Historical Volatility (20 days) -> Standard Deviation of log returns
    df['Log_Return'] = np.log(df['close'] / df['close'].shift(1))
    df['Volatility'] = df['Log_Return'].rolling(window=20).std() * np.sqrt(252) # Annualized

    # --- Key Event Screening ---
    
    # 1. Price Change > +/- 5%
    df['pct_chg'] = df['pct_chg'].fillna(0)
    events = df[ (df['pct_chg'] > 5) | (df['pct_chg'] < -5) ].copy()
    events['reason'] = events['pct_chg'].apply(lambda x: '大涨' if x > 0 else '大跌')
    
    # 2. Volume > 3 * 5-day Avg Volume
    df['Vol_MA5'] = talib.SMA(volume, timeperiod=5).shift(1) # Avg of prev 5 days
    vol_events = df[ (df['vol'] > 3 * df['Vol_MA5']) & (df['Vol_MA5'] > 0) ].copy()
    vol_events['reason'] = '巨量'
    
    # Merge events
    all_events = pd.concat([events, vol_events])
    # Deduplicate by date, prefer '大涨/大跌' over '巨量' if both happen
    all_events = all_events.sort_values('trade_date').drop_duplicates(subset=['trade_date'], keep='first')
    
    # Select top N most recent events (e.g., last 10)
    recent_events = all_events.tail(10)
    
    # Format events list
    event_list = []
    for _, row in recent_events.iterrows():
        event_list.append({
            "date": row['trade_date'].strftime('%Y%m%d'),
            "pct_chg": row['pct_chg'],
            "close": row['close'],
            "reason": row['reason'],
            "rsi": row['RSI'] if not pd.isna(row['RSI']) else 0
        })

    # Latest Status (Last row)
    last = df.iloc[-1]
    latest_status = {
        "date": last['trade_date'].strftime('%Y%m%d'),
        "close": last['close'],
        "ma5": last['MA5'],
        "ma20": last['MA20'],
        "ma60": last['MA60'],
        "rsi": last['RSI'],
        "macd": last['MACD'],
        "volatility": last['Volatility'],
        "pct_chg": last['pct_chg']
    }

    # Output JSON
    result = {
        "latest": latest_status,
        "events": event_list
    }
    
    print(json.dumps(result))

if __name__ == "__main__":
    main()
