import { ChangeEvent, useMemo, useState } from 'react';
import { Divider, Group, Stack } from '@mantine/core';
import { NumberInput, Switch, Text, Select, SpinnerIcon } from '/@/renderer/components';
import { AlbumListFilter, useAlbumListStore, useSetAlbumFilters } from '/@/renderer/store';
import { useDebouncedValue } from '@mantine/hooks';
import debounce from 'lodash/debounce';
import { useGenreList } from '/@/renderer/features/genres';
import { useAlbumArtistList } from '/@/renderer/features/artists/queries/album-artist-list-query';
import { AlbumArtistListSort, SortOrder } from '/@/renderer/api/types';

interface NavidromeAlbumFiltersProps {
  disableArtistFilter?: boolean;
  handleFilterChange: (filters: AlbumListFilter) => void;
}

export const NavidromeAlbumFilters = ({
  handleFilterChange,
  disableArtistFilter,
}: NavidromeAlbumFiltersProps) => {
  const { filter } = useAlbumListStore();
  const setFilters = useSetAlbumFilters();

  const genreListQuery = useGenreList(null);

  const genreList = useMemo(() => {
    if (!genreListQuery?.data) return [];
    return genreListQuery.data.map((genre) => ({
      label: genre.name,
      value: genre.id,
    }));
  }, [genreListQuery.data]);

  const handleGenresFilter = debounce((e: string | null) => {
    const updatedFilters = setFilters({
      ndParams: {
        ...filter.ndParams,
        genre_id: e || undefined,
      },
    });
    handleFilterChange(updatedFilters);
  }, 250);

  const toggleFilters = [
    {
      label: 'Is rated',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = setFilters({
          ndParams: { ...filter.ndParams, has_rating: e.currentTarget.checked ? true : undefined },
        });
        handleFilterChange(updatedFilters);
      },
      value: filter.ndParams?.has_rating,
    },
    {
      label: 'Is favorited',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = setFilters({
          ndParams: { ...filter.ndParams, starred: e.currentTarget.checked ? true : undefined },
        });
        handleFilterChange(updatedFilters);
      },
      value: filter.ndParams?.starred,
    },
    {
      label: 'Is compilation',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = setFilters({
          ndParams: { ...filter.ndParams, compilation: e.currentTarget.checked ? true : undefined },
        });
        handleFilterChange(updatedFilters);
      },
      value: filter.ndParams?.compilation,
    },
    {
      label: 'Is recently played',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        const updatedFilters = setFilters({
          ndParams: {
            ...filter.ndParams,
            recently_played: e.currentTarget.checked ? true : undefined,
          },
        });
        handleFilterChange(updatedFilters);
      },
      value: filter.ndParams?.recently_played,
    },
  ];

  const handleYearFilter = debounce((e: number | undefined) => {
    const updatedFilters = setFilters({
      ndParams: {
        ...filter.ndParams,
        year: e,
      },
    });
    handleFilterChange(updatedFilters);
  }, 500);

  const [albumArtistSearchTerm, setAlbumArtistSearchTerm] = useState<string>('');
  const [debouncedSearchTerm] = useDebouncedValue(albumArtistSearchTerm, 200);

  const albumArtistListQuery = useAlbumArtistList(
    {
      limit: 300,
      searchTerm: debouncedSearchTerm,
      sortBy: AlbumArtistListSort.NAME,
      sortOrder: SortOrder.ASC,
      startIndex: 0,
    },
    {
      enabled: debouncedSearchTerm ? debouncedSearchTerm !== '' : false,
    },
  );

  const selectableAlbumArtists = useMemo(() => {
    if (!albumArtistListQuery?.data?.items) return [];

    return albumArtistListQuery?.data?.items?.map((artist) => ({
      label: artist.name,
      value: artist.id,
    }));
  }, [albumArtistListQuery?.data?.items]);

  return (
    <Stack p="0.8rem">
      {toggleFilters.map((filter) => (
        <Group
          key={`nd-filter-${filter.label}`}
          position="apart"
        >
          <Text>{filter.label}</Text>
          <Switch
            checked={filter?.value || false}
            onChange={filter.onChange}
          />
        </Group>
      ))}
      <Divider my="0.5rem" />
      <Group grow>
        <NumberInput
          hideControls={false}
          label="Year"
          max={5000}
          min={0}
          value={filter.ndParams?.year}
          onChange={handleYearFilter}
        />
        <Select
          clearable
          searchable
          data={genreList}
          defaultValue={filter.ndParams?.genre_id}
          label="Genre"
          onChange={handleGenresFilter}
        />
      </Group>
      <Group grow>
        <Select
          clearable
          searchable
          data={selectableAlbumArtists}
          disabled={disableArtistFilter}
          label="Artist"
          limit={300}
          placeholder="Type to search for an artist"
          rightSection={albumArtistListQuery.isFetching ? <SpinnerIcon /> : undefined}
          searchValue={albumArtistSearchTerm}
          onSearchChange={setAlbumArtistSearchTerm}
        />
      </Group>
    </Stack>
  );
};
