import React from 'react';
import PropTypes from 'prop-types';

import { ClassNames } from '@emotion/core';
import styled from '@emotion/styled';
import { reactSelectStyles, colors, lengths, styleStrings, buttons, borders } from 'netlify-cms-ui-default';

import Map from 'ol/Map.js';
import olStyles from 'ol/ol.css';
import View from 'ol/View.js';
import GeoJSON from 'ol/format/GeoJSON';
import Draw from 'ol/interaction/Draw.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import OSMSource from 'ol/source/OSM.js';
import VectorSource from 'ol/source/Vector.js';

import Select from 'react-select';
import debounce from 'lodash/debounce';

const formatOptions = {
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857',
};

const AddLocationButton = styled.button`
  ${buttons.button};
  ${buttons.default};
  ${buttons.green};
`;


const getDefaultFormat = () => new GeoJSON(formatOptions);

const getDefaultMap = (target, featuresLayer) =>
  new Map({
    target,
    layers: [new TileLayer({ source: new OSMSource() }), featuresLayer],
    view: new View({ center: [0, 0], zoom: 2 }),
  });

export default function withMapControl({ getFormat, getMap } = {}) {
  return class MapControl extends React.Component {
    static propTypes = {
      onChange: PropTypes.func.isRequired,
      field: PropTypes.object.isRequired,
      value: PropTypes.node,
    };

    static defaultProps = {
      value: '',
    };

    constructor(props) {
      super(props);
      this.state = {
        inputValue: '',
        options: [],
        selectedCity: '',
        isLoading: false,
      }
      this.mapContainer = React.createRef();
    }

    componentDidMount() {
      this.drawMap();
    }

    drawMap = () => {
      const { field, onChange, value } = this.props;
      const format = getFormat ? getFormat(field) : getDefaultFormat(field);
      const features = value ? [format.readFeature(value)] : [];

      const featuresSource = new VectorSource({ features, wrapX: false });
      const featuresLayer = new VectorLayer({ source: featuresSource });

      const target = this.mapContainer.current;
      const map = getMap ? getMap(target, featuresLayer) : getDefaultMap(target, featuresLayer);

      if (features.length > 0) {
        map.getView().fit(featuresSource.getExtent(), { maxZoom: 16, padding: [80, 80, 80, 80] });
      }

      const draw = new Draw({ source: featuresSource, type: field.get('type', 'Point') });
      map.addInteraction(draw);

      const writeOptions = { decimals: field.get('decimals', 7) };
      draw.on('drawend', ({ feature }) => {
        featuresSource.clear();
        onChange(format.writeGeometry(feature.getGeometry(), writeOptions));
      });
    }

    getOpenStreetMapSearch = debounce(({query}) => {
      this.setState({ isLoading: true });
      const queryURL = `https://nominatim.openstreetmap.org/search.php?q=${query}&format=json`
      fetch(queryURL)
        .then(response => response.json())
        .then(data => {
          const options = [];
          for(const place of data) {
            options.push({
              label: place.display_name,
              value: place.place_id,
              lon: place.lon,
              lat: place.lat,
            })
          }
          this.setState({ options, isLoading: false })
        })
        .catch(error => {
          console.error(error)
          this.setState({ isLoading: false })
        })
    }, 300)

    handleInputChange = (value) => {
      this.setState({ inputValue: value }, () => {
        this.getOpenStreetMapSearch({query: value})
      });
      return value;
    }

    handleSelectChange = (value) => {
      this.setState({
        selectedCity: value,
        inputValue: '',
      })
    }

    render() {
      return (
          <ClassNames>
            {({ cx, css }) => (
              <div className={cx(
                this.props.classNameWrapper,
                css`
                  ${lengths.objectWidgetTopBarPadding};
                  border: ${borders.textField};
                `
              )}>
                <Select
                  isLoading={this.state.isLoading}
                  value={this.state.inputValue}
                  options={this.state.options}
                  onChange={this.handleSelectChange}
                  onInputChange={this.handleInputChange}
                  placeholder="Search for a location..."
                  styles={reactSelectStyles}
                  className={css`
                    border: ${borders.textField};
                  `}
                />
                { this.state.selectedCity &&
                  <p className={css`
                      color: #333;
                      margin-top: 20px;
                    `}
                  >
                    <AddLocationButton>Add to map</AddLocationButton>
                    <span className={css`margin-left: 10px;`}>
                      {this.state.selectedCity.label}
                    </span>
                  </p>
                }

                <div
                  className={css`
                    ${olStyles};
                    padding: 0;
                    margin-top: 20px;
                    overflow: hidden;
                  `}
                  ref={this.mapContainer}
                />
              </div>
            )}
          </ClassNames>
      );
    }
  };
}
