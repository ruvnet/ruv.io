use napi_derive::napi;
use bit_parallel_search::BitParallelSearcher;

#[napi]
pub struct BitParallelSearch {
  searcher: BitParallelSearcher,
}

#[napi]
impl BitParallelSearch {
  #[napi(constructor)]
  pub fn new(pattern: String) -> napi::Result<Self> {
    let searcher = BitParallelSearcher::new(pattern.as_bytes());
    Ok(BitParallelSearch { searcher })
  }

  /// Search for all occurrences of the pattern in the haystack
  #[napi]
  pub fn search_all(&self, haystack: String) -> Vec<u32> {
    let haystack_bytes = haystack.as_bytes();
    let mut positions = Vec::new();
    let mut offset = 0;

    while offset < haystack_bytes.len() {
      if let Some(pos) = self.searcher.find_in(&haystack_bytes[offset..]) {
        let abs_pos = offset + pos;
        positions.push(abs_pos as u32);
        offset = abs_pos + 1;
      } else {
        break;
      }
    }

    positions
  }

  /// Find the first occurrence of the pattern in the haystack
  #[napi]
  pub fn search_first(&self, haystack: String) -> Option<u32> {
    self.searcher.find_in(haystack.as_bytes()).map(|p| p as u32)
  }

  /// Count occurrences of the pattern in the haystack
  #[napi]
  pub fn count(&self, haystack: String) -> u32 {
    self.search_all(haystack).len() as u32
  }

  /// Check if pattern exists in haystack
  #[napi]
  pub fn contains(&self, haystack: String) -> bool {
    self.searcher.find_in(haystack.as_bytes()).is_some()
  }
}

/// Utility function: Simple search without creating a searcher instance
#[napi]
pub fn search(haystack: String, needle: String) -> Vec<u32> {
  let searcher = BitParallelSearcher::new(needle.as_bytes());
  let haystack_bytes = haystack.as_bytes();
  let mut positions = Vec::new();
  let mut offset = 0;

  while offset < haystack_bytes.len() {
    if let Some(pos) = searcher.find_in(&haystack_bytes[offset..]) {
      let abs_pos = offset + pos;
      positions.push(abs_pos as u32);
      offset = abs_pos + 1;
    } else {
      break;
    }
  }

  positions
}

/// Utility function: Get search results with metadata
#[napi(object)]
pub struct SearchResult {
  pub positions: Vec<u32>,
  pub count: u32,
  pub found: bool,
}

/// Search with detailed result object
#[napi]
pub fn search_detailed(haystack: String, needle: String) -> SearchResult {
  let positions = search(haystack, needle);
  let count = positions.len() as u32;
  let found = !positions.is_empty();

  SearchResult {
    positions,
    count,
    found,
  }
}
