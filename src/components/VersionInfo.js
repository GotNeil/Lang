import React from 'react';
import { APP_VERSION } from '../version';
import './VersionInfo.css';

function VersionInfo() {
  return (
    <p className="version-info">- {APP_VERSION} -</p>
  );
}

export default VersionInfo;
