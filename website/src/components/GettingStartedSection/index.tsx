import React from 'react';
import Link from '@docusaurus/Link';

import styles from './styles.module.css';

const steps = [
  {
    num: 1,
    title: 'Import via Cursor Settings',
    description: (
      <>
        Open <strong>Cursor Settings</strong> → <strong>Rules</strong> → Add
        Rule → <strong>Remote Rule (GitHub)</strong> → enter{' '}
        <code>kkorus/cursor-collections</code>. Skills are available
        globally across every workspace immediately.
      </>
    ),
  },
  {
    num: 2,
    title: 'Configure MCP servers',
    description: (
      <>
        Open <strong>Cursor Settings → MCP</strong> → Add MCP Server → copy
        the contents of <code>.cursor/mcp.json</code> into your user MCP
        config. Connects Jira, Figma, Playwright, and Context7.
      </>
    ),
  },
  {
    num: 3,
    title: 'Open Agent chat',
    description: (
      <>
        Press <code>Cmd/Ctrl + Shift + I</code>, switch to{' '}
        <strong>Agent mode</strong>, then type <code>/</code> to see all
        available slash commands.
      </>
    ),
  },
  {
    num: 4,
    title: 'Run your first command',
    description: (
      <>
        Type <code>/tsh-implement [JIRA_ID]</code> to implement a task, or{' '}
        <code>/tsh-review</code> to review changes. If commands appear in the
        dropdown, you&apos;re ready.
      </>
    ),
  },
];

export default function GettingStartedSection(): React.JSX.Element {
  return (
    <section className={styles.gettingStarted}>
      <div className={styles.gettingStartedInner}>
        <div className={styles.leftCol}>
          <h2>
            Set up once.
            <br />
            Works across
            <br />
            every project.
          </h2>
          <p className={styles.sub}>
            Import once via Cursor Settings, configure MCP servers, and start
            using <code>/tsh-implement</code> in any workspace immediately.
          </p>
          <div className={styles.gsActions}>
            <Link
              className="tsh-btn-primary"
              href="https://github.com/kkorus/cursor-collections"
              target="_blank"
              rel="noopener noreferrer"
            >
              Get the repo on GitHub
            </Link>
            <Link className="tsh-btn-secondary" to="/docs/">
              Read the docs
            </Link>
          </div>
        </div>
        <div className={styles.steps}>
          {steps.map((step, idx) => (
            <div
              key={step.num}
              className={`${styles.step} ${idx === 0 ? styles.stepFirst : ''} ${idx === steps.length - 1 ? styles.stepLast : ''}`}
            >
              <div className={styles.stepNum}>{step.num}</div>
              <div className={styles.stepContent}>
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
