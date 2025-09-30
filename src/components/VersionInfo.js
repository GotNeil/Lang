import React from 'react';
import versionData from '../../version.json'; // Adjust path as needed
import './VersionInfo.css';

function VersionInfo() {
  const { version, date } = versionData;
  return (
    <p className="version-info">- v. {version} ({date}) -</p>
  );
}

export default VersionInfo;
