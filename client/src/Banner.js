import React from 'react';

export default function Banner() {
  const text = 'Maison Decor Blog';
  return (
    <div className="main-banner-home flex items-center">
      <div className="container grid grid-cols-2 md:grid-cols-4 gap-2">
        <div />
        <div className="text-center">
          <h2 className="h1">{text}</h2>
          <p className="p-banner">
          Discover the Latest Trends in Home Decor
          </p>
          <p />
        </div>
      </div>
    </div>
  );
    
}
