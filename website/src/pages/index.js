import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

function HomepageHeader() {
  return (
    <header className={clsx(styles.heroBanner)}>
      <div className="container">
        <img src="/skardi-docs/img/logo.png" alt="Skardi" className={styles.heroLogo} />
        <p className={styles.heroTagline}>
          Spark for Agents — a data platform that gives AI agents full data autonomy
          <br />
          so every dataset in your stack becomes something an agent can actually use.
        </p>
        <div className={styles.buttons}>
          <Link className={clsx('button button--lg', styles.btnPrimary)} to="/docs/intro">
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <HomepageHeader />
    </Layout>
  );
}
