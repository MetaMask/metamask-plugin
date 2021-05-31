import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Fuse from 'fuse.js';
import InputAdornment from '@material-ui/core/InputAdornment';
import TextField from '../../../../components/ui/text-field';
import { usePrevious } from '../../../../hooks/usePrevious';
import { isValidHexAddress } from '../../../../../shared/modules/hexstring-utils';
import { getSymbolAndDecimals } from '../../../../helpers/utils/token-util';

const renderAdornment = () => (
  <InputAdornment position="start" style={{ marginRight: '12px' }}>
    <img src="images/search.svg" width="17" height="17" alt="" />
  </InputAdornment>
);

export default function ListItemSearch({
  onSearch,
  error,
  listToSearch = [],
  fuseSearchKeys,
  searchPlaceholderText,
  defaultToAll,
  listContainerClassName,
}) {
  const fuseRef = useRef();
  const [searchQuery, setSearchQuery] = useState('');
  const isTokenToDropdown =
    listContainerClassName === 'build-quote__open-to-dropdown';

  /**
   * Search a custom token for import based on a contract address.
   * @param {String} contractAddress
   */
  const handleSearchTokenForImport = async (contractAddress) => {
    const newToken = await getSymbolAndDecimals(contractAddress);
    const tokenFound = newToken.symbol && newToken.decimals !== undefined;
    // Name, address and logoUrl will be returned from a new API
    // that we will call instead of "getSymbolAndDecimals".
    newToken.name = newToken.symbol;
    newToken.primaryLabel = newToken.symbol;
    newToken.address = contractAddress;
    newToken.notImported = true;
    setSearchQuery(contractAddress);
    onSearch({
      searchQuery: contractAddress,
      results: tokenFound ? [newToken] : [],
    });
  };

  const handleSearch = async (newSearchQuery) => {
    const trimmedNewSearchQuery = newSearchQuery.trim();
    const validHexAddress = isValidHexAddress(trimmedNewSearchQuery);
    const fuseSearchResult = fuseRef.current.search(newSearchQuery);
    const results =
      defaultToAll && newSearchQuery === '' ? listToSearch : fuseSearchResult;
    if (isTokenToDropdown && results.length === 0 && validHexAddress) {
      await handleSearchTokenForImport(trimmedNewSearchQuery);
      return;
    }
    setSearchQuery(newSearchQuery);
    onSearch({
      searchQuery: newSearchQuery,
      results,
    });
  };

  useEffect(() => {
    if (!fuseRef.current) {
      fuseRef.current = new Fuse(listToSearch, {
        shouldSort: true,
        threshold: 0.45,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: fuseSearchKeys,
      });
    }
  }, [fuseSearchKeys, listToSearch]);

  const previousListToSearch = usePrevious(listToSearch ?? []);
  useEffect(() => {
    if (
      fuseRef.current &&
      searchQuery &&
      previousListToSearch !== listToSearch
    ) {
      fuseRef.current.setCollection(listToSearch);
      const fuseSearchResult = fuseRef.current.search(searchQuery);
      onSearch({ searchQuery, results: fuseSearchResult });
    }
  }, [listToSearch, searchQuery, onSearch, previousListToSearch]);

  return (
    <TextField
      data-testid="search-list-items"
      className="searchable-item-list__search"
      placeholder={searchPlaceholderText}
      type="text"
      value={searchQuery}
      onChange={(e) => handleSearch(e.target.value)}
      error={error}
      fullWidth
      startAdornment={renderAdornment()}
      autoComplete="off"
      autoFocus
    />
  );
}

ListItemSearch.propTypes = {
  onSearch: PropTypes.func,
  error: PropTypes.string,
  listToSearch: PropTypes.array.isRequired,
  fuseSearchKeys: PropTypes.arrayOf(PropTypes.object).isRequired,
  searchPlaceholderText: PropTypes.string,
  defaultToAll: PropTypes.bool,
  listContainerClassName: PropTypes.string,
};