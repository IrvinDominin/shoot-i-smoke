// Sh**t! I Smoke
// Copyright (C) 2018-2019  Marcelo S. Coelho, Amaury Martiny

// Sh**t! I Smoke is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Sh**t! I Smoke is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Sh**t! I Smoke.  If not, see <http://www.gnu.org/licenses/>.

import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { NavigationInjectedProps } from 'react-navigation';
import truncate from 'truncate';

import homeIcon from '../../../assets/images/home.png';
import stationIcon from '../../../assets/images/station.png';
import { Distance } from './Distance';
import { Header } from './Header';
import { i18n } from '../../localization';
import { ApiContext, CurrentLocationContext } from '../../stores';
import { trackScreen } from '../../util/amplitude';
import { useDistanceUnit } from '../../stores/distanceUnit';
import { distanceToStation, getCorrectLatLng } from '../../util/station';

interface DetailsProps extends NavigationInjectedProps {}

// Holds the ref to the MapView.Marker representing the AQI station
let stationMarker: Marker | undefined;

export function Details (props: DetailsProps) {
  const { navigation } = props;

  const [showMap, setShowMap] = useState(false);
  const { api } = useContext(ApiContext);
  const { currentLocation: _currentLocation } = useContext(CurrentLocationContext);
  const { distanceUnit } = useDistanceUnit();

  trackScreen('DETAILS');

  useEffect(() => {
    // Show map after 200ms for smoother screen transition
    setTimeout(() => setShowMap(true), 500);
  }, []);

  const handleMapReady = () => {
    stationMarker && stationMarker.showCallout && stationMarker.showCallout();
  };

  const handleStationRef = (ref: Marker) => {
    stationMarker = ref;
  };

  // TODO
  // I have no idea why, but if we don't clone the object, and continue to
  // use `location.current` everywhere, we get a `setting key of frozen
  // object` error. It's related to the MapView below.
  const currentLocation = { ..._currentLocation! };

  const distance = distanceToStation(currentLocation!, api!, distanceUnit);

  const station = {
    description: api!.shootISmoke.station || '',
    title: api!.shootISmoke.station,
    ...getCorrectLatLng(currentLocation, {
      latitude: api!.city.geo[0],
      longitude: api!.city.geo[1]
    })
  };

  return (
    <View style={styles.container}>
      <Header onBackClick={() => navigation.goBack()} />
      <View style={styles.mapContainer}>
        {showMap && (
          <MapView
            initialRegion={{
              latitude: (currentLocation.latitude + station.latitude) / 2,
              latitudeDelta: Math.abs(currentLocation.latitude - station.latitude) * 2,
              longitude: (currentLocation.longitude + station.longitude) / 2,
              longitudeDelta: Math.abs(currentLocation.longitude - station.longitude) * 2
            }}
            onMapReady={handleMapReady}
            style={styles.map}
          >
            <Marker
              coordinate={station}
              image={stationIcon}
              ref={handleStationRef}
              title={i18n.t('details_air_quality_station_marker')}
              description={truncate(station.description, 40)}
            />
            <Marker
              coordinate={currentLocation}
              image={homeIcon}
              title={i18n.t('details_your_position_marker')}
            />
          </MapView>
        )}
      </View>
      <Distance distance={distance} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1
  },
  map: {
    flexGrow: 1
  },
  mapContainer: {
    flexGrow: 1
  }
});
