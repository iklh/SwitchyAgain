import React from 'react';
import {createRoot} from 'react-dom/client';

function OptionsExperiment() {
  return (
    <main className="react-preview">
      <header>
        <span className="react-preview__label">SwitchyAgain</span>
        <h1>Options preview</h1>
      </header>
      <section>
        <p>React entry loaded inside the extension package.</p>
      </section>
    </main>
  );
}

const rootElement = document.getElementById('react-root');

if (!rootElement) {
  throw new Error('Missing React root element.');
}

createRoot(rootElement).render(<OptionsExperiment />);
