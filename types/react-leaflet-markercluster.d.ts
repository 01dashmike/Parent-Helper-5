declare module "react-leaflet-markercluster" {
  import { Component, ReactNode } from "react";
  import { LayerGroupProps } from "react-leaflet";
  import { DivIcon } from "leaflet";

  export interface MarkerClusterGroupProps extends LayerGroupProps {
    children?: ReactNode;
    iconCreateFunction?: (cluster: any) => DivIcon;
    maxClusterRadius?: number;
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    animate?: boolean;
    animateAddingMarkers?: boolean;
    removeOutsideVisibleBounds?: boolean;
    chunkedLoading?: boolean;
    disableClusteringAtZoom?: number;
    spiderfyDistanceMultiplier?: number;
    [key: string]: any; // Allow additional props
  }

  export default class MarkerClusterGroup extends Component<MarkerClusterGroupProps> {}
}

