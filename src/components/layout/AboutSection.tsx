import React from 'react';

export default function AboutSection() {
  return (
    <div className='max-w-3xl mx-auto px-4 py-12 text-center space-y-8 md:space-y-12 '>
      <h1 className='block text-xl md:text-3xl font-semibold uppercase leading-6 tracking-wide md:tracking-wider text-sky-dark dark:text-sky-light md:mb-24'>
        Ne maradj le egyetlen élményről sem
      </h1>
      <div className='space-y-2'>
        <h3 className='uppercase font-bold text-grey-dark-2 text-start'>
          Átvétel, ahol neked kényelmes
        </h3>
        <p className='text-base text-start md:text-lg text-gray-dark-1 leading-relaxed'>
          Vedd át autódat ott, ahol a legkényelmesebb: közvetlenül a szállodád,
          apartmanod vagy a megadott cím előtt. Így már az első perctől szabadon
          indulhatsz felfedezni.
        </p>
      </div>
      <div className='space-y-2'>
        <h3 className='uppercase font-bold text-grey-dark-2 text-start'>
          Kényelmes transzfer igény szerint
        </h3>
        <p className='text-base text-start md:text-lg text-gray-dark-1 leading-relaxed'>
          Ha szeretnél transzfer szolgáltatást is igénybe venni, jelezd
          egyszerűen ajánlatkérő adatlapunkon – mi pedig gondoskodunk róla, hogy
          minden gördülékenyen menjen.
        </p>
      </div>
    </div>
  );
}
