use napi::{bindgen_prelude::*, JsObject, JsString, JsUnknown};
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
    match BitParallelSearcher::new(pattern.clone()) {
      Ok(searcher) => {
        Ok(BitParallelSearch { searcher })
      }
      Err(_) => {
        Err(napi::Error::new(
          napi::Status::InvalidArg,
          format!("Failed to create searcher with pattern: {}", pattern),
        ))
      }
    }
  }

  /// Search for all occurrences of the pattern in the haystack
  #[napi]
  pub fn search_all(&self, haystack: String) -> napi::Result<Vec<u32>> {
    match self.searcher.search_all(&haystack) {
      Ok(positions) => {
        Ok(positions.iter().map(|&p| p as u32).collect())
      }
      Err(_) => {
        Err(napi::Error::new(
          napi::Status::GenericFailure,
          "Failed to search in haystack",
        ))
      }
    }
  }

  /// Find the first occurrence of the pattern in the haystack
  #[napi]
  pub fn search_first(&self, haystack: String) -> napi::Result<Option<u32>> {
    match self.searcher.search_first(&haystack) {
      Ok(position) => {
        Ok(position.map(|p| p as u32))
      }
      Err(_) => {
        Err(napi::Error::new(
          napi::Status::GenericFailure,
          "Failed to search first occurrence",
        ))
      }
    }
  }

  /// Count occurrences of the pattern in the haystack
  #[napi]
  pub fn count(&self, haystack: String) -> napi::Result<u32> {
    match self.searcher.count(&haystack) {
      Ok(count) => Ok(count as u32),
      Err(_) => {
        Err(napi::Error::new(
          napi::Status::GenericFailure,
          "Failed to count occurrences",
        ))
      }
    }
  }

  /// Check if pattern exists in haystack
  #[napi]
  pub fn contains(&self, haystack: String) -> napi::Result<bool> {
    match self.searcher.contains(&haystack) {
      Ok(found) => Ok(found),
      Err(_) => {
        Err(napi::Error::new(
          napi::Status::GenericFailure,
          "Failed to check if pattern exists",
        ))
      }
    }
  }
}

/// Utility function: Simple search without creating a searcher instance
#[napi]
pub fn search(haystack: String, needle: String) -> napi::Result<Vec<u32>> {
  match BitParallelSearcher::new(needle) {
    Ok(searcher) => {
      match searcher.search_all(&haystack) {
        Ok(positions) => {
          Ok(positions.iter().map(|&p| p as u32).collect())
        }
        Err(_) => {
          Err(napi::Error::new(
            napi::Status::GenericFailure,
            "Failed to search",
          ))
        }
      }
    }
    Err(_) => {
      Err(napi::Error::new(
        napi::Status::InvalidArg,
        "Invalid needle pattern",
      ))
    }
  }
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
pub fn search_detailed(haystack: String, needle: String) -> napi::Result<SearchResult> {
  match BitParallelSearcher::new(needle) {
    Ok(searcher) => {
      match (
        searcher.search_all(&haystack),
        searcher.count(&haystack),
      ) {
        (Ok(positions), Ok(count)) => {
          let positions_u32: Vec<u32> = positions.iter().map(|&p| p as u32).collect();
          let found = !positions_u32.is_empty();
          Ok(SearchResult {
            positions: positions_u32,
            count: count as u32,
            found,
          })
        }
        _ => {
          Err(napi::Error::new(
            napi::Status::GenericFailure,
            "Failed to perform search",
          ))
        }
      }
    }
    Err(_) => {
      Err(napi::Error::new(
        napi::Status::InvalidArg,
        "Invalid needle pattern",
      ))
    }
  }
}
