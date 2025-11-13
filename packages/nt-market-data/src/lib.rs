use napi::{bindgen_prelude::*};
use napi_derive::napi;
use serde::{Deserialize, Serialize};

/// OHLCV (Open, High, Low, Close, Volume) data point
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OHLCV {
    timestamp: i64,
    open: f64,
    high: f64,
    low: f64,
    close: f64,
    volume: i64,
}

/// Quote data representing bid/ask information
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Quote {
    symbol: String,
    timestamp: i64,
    bid_price: f64,
    bid_size: i64,
    ask_price: f64,
    ask_size: i64,
}

/// Trade data representing individual trade execution
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Trade {
    symbol: String,
    timestamp: i64,
    price: f64,
    size: i64,
    side: String,
}

/// Cached market data entry
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CachedData {
    symbol: String,
    data_type: String,
    timestamp: i64,
    data: serde_json::Value,
    ttl: i64,
}

/// Market data normalized structure
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct NormalizedMarketData {
    symbol: String,
    timestamp: i64,
    price: f64,
    volume: i64,
    data_quality: f64,
    source: String,
}

/// Ingestion result with statistics
#[derive(Serialize, Deserialize, Debug)]
struct IngestionResult {
    symbol: String,
    record_count: usize,
    timestamp: i64,
    processing_duration_ms: u128,
    success: bool,
}

/// Cache statistics
#[derive(Serialize, Deserialize, Debug)]
struct CacheStats {
    total_entries: usize,
    cache_hits: u64,
    cache_misses: u64,
    hit_rate: f64,
    memory_bytes: usize,
    timestamp: i64,
}

/// Buffer information
#[derive(Serialize, Deserialize, Debug)]
struct BufferInfo {
    symbol: String,
    buffer_size: usize,
    oldest_timestamp: i64,
    newest_timestamp: i64,
    data_points: usize,
    utilization_percent: f64,
}

// ============ OHLCV Functions ============

/// Create OHLCV data point
///
/// # Arguments
/// * `ohlcv_json` - JSON string containing OHLCV data
///
/// # Returns
/// JSON string with OHLCV data
#[napi]
pub fn create_ohlcv(ohlcv_json: String) -> Result<String> {
    let ohlcv: OHLCV = serde_json::from_str(&ohlcv_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse OHLCV JSON: {}", e)))?;

    if ohlcv.high < ohlcv.low {
        return Err(Error::from_reason(
            "High price must be greater than or equal to low price",
        ));
    }

    if ohlcv.close > ohlcv.high || ohlcv.close < ohlcv.low {
        return Err(Error::from_reason(
            "Close price must be between low and high",
        ));
    }

    serde_json::to_string(&ohlcv)
        .map_err(|e| Error::from_reason(format!("Failed to serialize OHLCV: {}", e)))
}

/// Process OHLCV data batch
///
/// # Arguments
/// * `ohlcv_batch_json` - JSON array of OHLCV data
///
/// # Returns
/// JSON string with aggregated statistics
#[napi]
pub fn process_ohlcv_batch(ohlcv_batch_json: String) -> Result<String> {
    let ohlcv_data: Vec<OHLCV> = serde_json::from_str(&ohlcv_batch_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse OHLCV batch: {}", e)))?;

    if ohlcv_data.is_empty() {
        return Err(Error::from_reason("OHLCV batch cannot be empty"));
    }

    let mut high_price = ohlcv_data[0].high;
    let mut low_price = ohlcv_data[0].low;
    let mut total_volume: i64 = 0;
    let first_open = ohlcv_data[0].open;
    let last_close = ohlcv_data[ohlcv_data.len() - 1].close;

    for ohlcv in &ohlcv_data {
        high_price = high_price.max(ohlcv.high);
        low_price = low_price.min(ohlcv.low);
        total_volume += ohlcv.volume;
    }

    let aggregated = serde_json::json!({
        "period_high": high_price,
        "period_low": low_price,
        "period_open": first_open,
        "period_close": last_close,
        "total_volume": total_volume,
        "candle_count": ohlcv_data.len(),
        "price_change": last_close - first_open,
        "price_change_percent": ((last_close - first_open) / first_open * 100.0)
    });

    serde_json::to_string(&aggregated)
        .map_err(|e| Error::from_reason(format!("Failed to serialize aggregated OHLCV: {}", e)))
}

// ============ Quote Functions ============

/// Process quote data (bid/ask)
///
/// # Arguments
/// * `quote_json` - JSON string containing quote data
///
/// # Returns
/// JSON string with processed quote and spread
#[napi]
pub fn process_quote(quote_json: String) -> Result<String> {
    let quote: Quote = serde_json::from_str(&quote_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse quote JSON: {}", e)))?;

    if quote.ask_price < quote.bid_price {
        return Err(Error::from_reason(
            "Ask price must be greater than or equal to bid price",
        ));
    }

    let spread = quote.ask_price - quote.bid_price;
    let spread_bps = (spread / quote.bid_price) * 10000.0;
    let mid_price = (quote.bid_price + quote.ask_price) / 2.0;

    let processed = serde_json::json!({
        "symbol": quote.symbol,
        "timestamp": quote.timestamp,
        "bid_price": quote.bid_price,
        "bid_size": quote.bid_size,
        "ask_price": quote.ask_price,
        "ask_size": quote.ask_size,
        "mid_price": mid_price,
        "spread": spread,
        "spread_bps": spread_bps,
    });

    serde_json::to_string(&processed)
        .map_err(|e| Error::from_reason(format!("Failed to serialize quote: {}", e)))
}

/// Process batch of quotes
///
/// # Arguments
/// * `quotes_json` - JSON array of quote data
///
/// # Returns
/// JSON string with processed quotes
#[napi]
pub fn process_quote_batch(quotes_json: String) -> Result<String> {
    let quotes: Vec<Quote> = serde_json::from_str(&quotes_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse quotes JSON: {}", e)))?;

    if quotes.is_empty() {
        return Err(Error::from_reason("Quote batch cannot be empty"));
    }

    let mut processed_quotes = Vec::new();

    for quote in &quotes {
        let spread = quote.ask_price - quote.bid_price;
        let spread_bps = (spread / quote.bid_price) * 10000.0;
        let mid_price = (quote.bid_price + quote.ask_price) / 2.0;

        processed_quotes.push(serde_json::json!({
            "symbol": quote.symbol,
            "timestamp": quote.timestamp,
            "mid_price": mid_price,
            "spread": spread,
            "spread_bps": spread_bps,
        }));
    }

    serde_json::to_string(&processed_quotes)
        .map_err(|e| Error::from_reason(format!("Failed to serialize quotes: {}", e)))
}

// ============ Trade Functions ============

/// Process trade data
///
/// # Arguments
/// * `trade_json` - JSON string containing trade data
///
/// # Returns
/// JSON string with processed trade
#[napi]
pub fn process_trade(trade_json: String) -> Result<String> {
    let trade: Trade = serde_json::from_str(&trade_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse trade JSON: {}", e)))?;

    if trade.price <= 0.0 {
        return Err(Error::from_reason("Trade price must be positive"));
    }

    if trade.size <= 0 {
        return Err(Error::from_reason("Trade size must be positive"));
    }

    let notional_value = trade.price * trade.size as f64;

    let processed = serde_json::json!({
        "symbol": trade.symbol,
        "timestamp": trade.timestamp,
        "price": trade.price,
        "size": trade.size,
        "side": trade.side,
        "notional_value": notional_value,
        "processed_at": get_current_timestamp(),
    });

    serde_json::to_string(&processed)
        .map_err(|e| Error::from_reason(format!("Failed to serialize trade: {}", e)))
}

/// Process batch of trades
///
/// # Arguments
/// * `trades_json` - JSON array of trade data
///
/// # Returns
/// JSON string with trade statistics
#[napi]
pub fn process_trade_batch(trades_json: String) -> Result<String> {
    let trades: Vec<Trade> = serde_json::from_str(&trades_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse trades JSON: {}", e)))?;

    if trades.is_empty() {
        return Err(Error::from_reason("Trade batch cannot be empty"));
    }

    let mut buy_volume: i64 = 0;
    let mut sell_volume: i64 = 0;
    let mut total_notional: f64 = 0.0;
    let mut vwap_sum: f64 = 0.0;
    let mut total_shares: i64 = 0;

    for trade in &trades {
        let notional = trade.price * trade.size as f64;
        total_notional += notional;

        if trade.side.to_lowercase() == "buy" {
            buy_volume += trade.size;
        } else {
            sell_volume += trade.size;
        }

        vwap_sum += notional;
        total_shares += trade.size;
    }

    let vwap = if total_shares > 0 {
        vwap_sum / total_shares as f64
    } else {
        0.0
    };

    let stats = serde_json::json!({
        "trade_count": trades.len(),
        "buy_volume": buy_volume,
        "sell_volume": sell_volume,
        "total_volume": buy_volume + sell_volume,
        "total_notional": total_notional,
        "vwap": vwap,
        "buy_sell_ratio": if sell_volume > 0 { buy_volume as f64 / sell_volume as f64 } else { 0.0 }
    });

    serde_json::to_string(&stats)
        .map_err(|e| Error::from_reason(format!("Failed to serialize trade batch: {}", e)))
}

// ============ Data Normalization ============

/// Normalize market data from different sources
///
/// # Arguments
/// * `raw_data_json` - JSON string with raw market data
///
/// # Returns
/// JSON string with normalized data
#[napi]
pub fn normalize_market_data(raw_data_json: String) -> Result<String> {
    let raw_data: serde_json::Value = serde_json::from_str(&raw_data_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse raw data JSON: {}", e)))?;

    let symbol = raw_data["symbol"]
        .as_str()
        .unwrap_or("UNKNOWN")
        .to_uppercase();
    let timestamp = raw_data["timestamp"]
        .as_i64()
        .unwrap_or_else(|| get_current_timestamp());
    let price = raw_data["price"].as_f64().unwrap_or(0.0);
    let volume = raw_data["volume"].as_i64().unwrap_or(0);
    let source = raw_data["source"].as_str().unwrap_or("UNKNOWN");

    let data_quality = calculate_data_quality(&raw_data);

    let normalized = NormalizedMarketData {
        symbol,
        timestamp,
        price,
        volume,
        data_quality,
        source: source.to_string(),
    };

    serde_json::to_string(&normalized)
        .map_err(|e| Error::from_reason(format!("Failed to serialize normalized data: {}", e)))
}

/// Normalize batch of market data
///
/// # Arguments
/// * `batch_json` - JSON array of market data
///
/// # Returns
/// JSON array with normalized data
#[napi]
pub fn normalize_batch(batch_json: String) -> Result<String> {
    let batch: Vec<serde_json::Value> = serde_json::from_str(&batch_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse batch JSON: {}", e)))?;

    if batch.is_empty() {
        return Err(Error::from_reason("Batch cannot be empty"));
    }

    let mut normalized_list = Vec::new();

    for item in batch {
        let symbol = item["symbol"]
            .as_str()
            .unwrap_or("UNKNOWN")
            .to_uppercase();
        let timestamp = item["timestamp"]
            .as_i64()
            .unwrap_or_else(|| get_current_timestamp());
        let price = item["price"].as_f64().unwrap_or(0.0);
        let volume = item["volume"].as_i64().unwrap_or(0);
        let source = item["source"].as_str().unwrap_or("UNKNOWN");

        let data_quality = calculate_data_quality(&item);

        normalized_list.push(NormalizedMarketData {
            symbol,
            timestamp,
            price,
            volume,
            data_quality,
            source: source.to_string(),
        });
    }

    serde_json::to_string(&normalized_list)
        .map_err(|e| Error::from_reason(format!("Failed to serialize normalized batch: {}", e)))
}

// ============ Data Ingestion ============

/// Ingest real-time market data
///
/// # Arguments
/// * `data_json` - JSON array of market data points
///
/// # Returns
/// JSON string with ingestion statistics
#[napi]
pub fn ingest_realtime_data(data_json: String) -> Result<String> {
    let start_time = std::time::Instant::now();

    let data: Vec<serde_json::Value> = serde_json::from_str(&data_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse ingestion data: {}", e)))?;

    if data.is_empty() {
        return Err(Error::from_reason("Ingestion data cannot be empty"));
    }

    let symbol = data[0]["symbol"]
        .as_str()
        .unwrap_or("UNKNOWN")
        .to_string();

    // Validate all records
    for (idx, record) in data.iter().enumerate() {
        if record["price"].as_f64().is_none() {
            return Err(Error::from_reason(format!(
                "Invalid price in record {}",
                idx
            )));
        }
    }

    let duration = start_time.elapsed().as_millis();

    let result = IngestionResult {
        symbol,
        record_count: data.len(),
        timestamp: get_current_timestamp(),
        processing_duration_ms: duration,
        success: true,
    };

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize ingestion result: {}", e)))
}

/// Ingest historical market data
///
/// # Arguments
/// * `data_json` - JSON array of historical market data
///
/// # Returns
/// JSON string with ingestion statistics
#[napi]
pub fn ingest_historical_data(data_json: String) -> Result<String> {
    let start_time = std::time::Instant::now();

    let data: Vec<serde_json::Value> = serde_json::from_str(&data_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse historical data: {}", e)))?;

    if data.is_empty() {
        return Err(Error::from_reason("Historical data cannot be empty"));
    }

    let symbol = data[0]["symbol"]
        .as_str()
        .unwrap_or("UNKNOWN")
        .to_string();

    // Validate and sort by timestamp
    let mut valid_records = Vec::new();

    for record in data {
        if record["timestamp"].as_i64().is_some() && record["price"].as_f64().is_some() {
            valid_records.push(record);
        }
    }

    valid_records.sort_by_key(|r| r["timestamp"].as_i64().unwrap_or(0));

    let duration = start_time.elapsed().as_millis();

    let result = IngestionResult {
        symbol,
        record_count: valid_records.len(),
        timestamp: get_current_timestamp(),
        processing_duration_ms: duration,
        success: true,
    };

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize ingestion result: {}", e)))
}

// ============ Data Caching ============

/// Create cache entry
///
/// # Arguments
/// * `cache_entry_json` - JSON string with cache data
///
/// # Returns
/// JSON string with cache entry
#[napi]
pub fn cache_market_data(cache_entry_json: String) -> Result<String> {
    let cached_data: CachedData = serde_json::from_str(&cache_entry_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse cache entry: {}", e)))?;

    if cached_data.ttl <= 0 {
        return Err(Error::from_reason("TTL must be positive"));
    }

    let expiry_timestamp = cached_data.timestamp + cached_data.ttl;

    let entry = serde_json::json!({
        "symbol": cached_data.symbol,
        "data_type": cached_data.data_type,
        "timestamp": cached_data.timestamp,
        "expiry_timestamp": expiry_timestamp,
        "ttl": cached_data.ttl,
        "data": cached_data.data,
        "cached_at": get_current_timestamp(),
    });

    serde_json::to_string(&entry)
        .map_err(|e| Error::from_reason(format!("Failed to serialize cache entry: {}", e)))
}

/// Get cache statistics
///
/// # Arguments
/// * `cache_size` - Total number of cache entries
/// * `hits` - Number of cache hits
/// * `misses` - Number of cache misses
///
/// # Returns
/// JSON string with cache statistics
#[napi]
pub fn get_cache_stats(cache_size: i32, hits: i64, misses: i64) -> Result<String> {
    let total_requests = hits + misses;
    let hit_rate = if total_requests > 0 {
        hits as f64 / total_requests as f64
    } else {
        0.0
    };

    let memory_bytes = cache_size as usize * 1024; // Approximate 1KB per entry

    let stats = CacheStats {
        total_entries: cache_size as usize,
        cache_hits: hits as u64,
        cache_misses: misses as u64,
        hit_rate,
        memory_bytes,
        timestamp: get_current_timestamp(),
    };

    serde_json::to_string(&stats)
        .map_err(|e| Error::from_reason(format!("Failed to serialize cache stats: {}", e)))
}

/// Invalidate expired cache entries
///
/// # Arguments
/// * `entries_json` - JSON array of cache entries
///
/// # Returns
/// JSON string with invalidation statistics
#[napi]
pub fn invalidate_expired_cache(entries_json: String) -> Result<String> {
    let entries: Vec<CachedData> = serde_json::from_str(&entries_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse cache entries: {}", e)))?;

    let current_time = get_current_timestamp();
    let mut expired_count = 0;
    let mut valid_count = 0;

    for entry in &entries {
        if current_time > (entry.timestamp + entry.ttl) {
            expired_count += 1;
        } else {
            valid_count += 1;
        }
    }

    let result = serde_json::json!({
        "total_entries": entries.len(),
        "expired_entries": expired_count,
        "valid_entries": valid_count,
        "timestamp": get_current_timestamp(),
    });

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize invalidation result: {}", e)))
}

// ============ Data Buffering ============

/// Create buffer for streaming data
///
/// # Arguments
/// * `symbol` - Market symbol
/// * `max_size` - Maximum buffer size
///
/// # Returns
/// JSON string with buffer info
#[napi]
pub fn create_buffer(symbol: String, max_size: i32) -> Result<String> {
    if max_size <= 0 {
        return Err(Error::from_reason("Buffer size must be positive"));
    }

    let info = BufferInfo {
        symbol,
        buffer_size: max_size as usize,
        oldest_timestamp: 0,
        newest_timestamp: get_current_timestamp(),
        data_points: 0,
        utilization_percent: 0.0,
    };

    serde_json::to_string(&info)
        .map_err(|e| Error::from_reason(format!("Failed to serialize buffer info: {}", e)))
}

/// Add data to buffer
///
/// # Arguments
/// * `buffer_info_json` - Current buffer info
/// * `data_points` - Number of data points being added
///
/// # Returns
/// JSON string with updated buffer info
#[napi]
pub fn add_to_buffer(buffer_info_json: String, data_points: i32) -> Result<String> {
    let mut info: BufferInfo = serde_json::from_str(&buffer_info_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse buffer info: {}", e)))?;

    info.data_points += data_points as usize;

    if info.data_points > info.buffer_size {
        // Simulate FIFO eviction
        info.data_points = info.buffer_size;
    }

    info.utilization_percent = (info.data_points as f64 / info.buffer_size as f64) * 100.0;
    info.newest_timestamp = get_current_timestamp();

    serde_json::to_string(&info)
        .map_err(|e| Error::from_reason(format!("Failed to serialize updated buffer: {}", e)))
}

/// Flush buffer and get data
///
/// # Arguments
/// * `buffer_info_json` - Buffer info
///
/// # Returns
/// JSON string with flushed buffer data
#[napi]
pub fn flush_buffer(buffer_info_json: String) -> Result<String> {
    let info: BufferInfo = serde_json::from_str(&buffer_info_json)
        .map_err(|e| Error::from_reason(format!("Failed to parse buffer info: {}", e)))?;

    let result = serde_json::json!({
        "symbol": info.symbol,
        "flushed_data_points": info.data_points,
        "flushed_at": get_current_timestamp(),
        "oldest_timestamp": info.oldest_timestamp,
        "newest_timestamp": info.newest_timestamp,
    });

    serde_json::to_string(&result)
        .map_err(|e| Error::from_reason(format!("Failed to serialize flush result: {}", e)))
}

// ============ Helper Functions ============

/// Get current timestamp in milliseconds
fn get_current_timestamp() -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};

    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();

    duration.as_millis() as i64
}

/// Calculate data quality score (0.0 to 1.0)
fn calculate_data_quality(data: &serde_json::Value) -> f64 {
    let mut quality: f64 = 1.0;

    // Penalize for missing fields
    if data.get("price").is_none() {
        quality -= 0.25;
    }
    if data.get("volume").is_none() {
        quality -= 0.25;
    }
    if data.get("timestamp").is_none() {
        quality -= 0.25;
    }
    if data.get("symbol").is_none() {
        quality -= 0.25;
    }

    quality.max(0.0).min(1.0)
}
