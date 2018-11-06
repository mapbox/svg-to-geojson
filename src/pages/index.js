import React from 'react';
import Helmet from 'react-helmet';
import App from '../components/app';

export default class Page extends React.Component {
  render() {
    return (
      <div>
        <Helmet>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>SVG to GeoJSON</title>
        </Helmet>
        <App />
      </div>
    );
  }
}
