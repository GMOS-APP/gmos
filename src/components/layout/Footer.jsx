import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800/60 px-6 py-4 text-[11px] text-zinc-500 dark:text-zinc-600 space-y-1">
      <p>
        {'Lazy RPG Prep method from the '}
        <a href="https://slyflourish.com/lazy_gm_resource_document.html" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-zinc-400">
          Lazy GM's Resource Document
        </a>
        {' by Michael E. Shea of '}
        <a href="https://slyflourish.com" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-zinc-400">
          SlyFlourish.com
        </a>
        {', available under a '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-zinc-400">
          Creative Commons Attribution 4.0 International License
        </a>
        .
      </p>
      <p>
        {'Game rules and content from the '}
        <a href="https://dnd.wizards.com/resources/systems-reference-document" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-zinc-400">
          D&D Systems Reference Document 5.1
        </a>
        {' © Wizards of the Coast, available under a '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-zinc-400">
          Creative Commons Attribution 4.0 International License
        </a>
        .
      </p>
    </footer>
  );
}
