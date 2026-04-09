import React from 'react';
import './tailwind.scss';
import type { IEnexAntiDrogasProps } from './IEnexAntiDrogasProps';
import App from './App';

export default class EnexAntiDrogas extends React.Component<IEnexAntiDrogasProps, {}> {
  public render(): React.ReactElement<IEnexAntiDrogasProps> {
    return (
      <App {...this.props} />
    );
  }
}
