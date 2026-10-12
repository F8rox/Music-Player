// Static page: privacy note and credits. No data is read from storage or the network.
export const About = () => (
  <section className="about">
    <div className="page-header"><h1 className="page-title">About</h1></div>
    <div className="panel about-card">
      <h2>Your music stays on your device</h2>
      <p>
        Songs you add are stored in this browser only. They are never uploaded, and the app makes no network
        requests for your music, your lyrics or your listening. Clear this site&apos;s data in your browser to
        remove everything.
      </p>
    </div>
    <div className="panel about-card">
      <h2>How it works</h2>
      <p>
        Each song is analysed once, in your browser, for its tempo, key and loudness. That powers smart crossfade,
        Start radio, Draw your vibe, and normalised volume. Lyrics come from <code>.lrc</code> files you add
        yourself.
      </p>
    </div>
    <div className="panel about-card">
      <h2>Credits</h2>
      <ul>
        <li>Inter, by Rasmus Andersson and contributors (SIL Open Font License 1.1)</li>
        <li>Instrument Serif, by Instrument (SIL Open Font License 1.1)</li>
        <li>music-metadata, dnd-kit, idb-keyval, React and React Router (MIT or Apache-2.0)</li>
      </ul>
    </div>
  </section>
);
