import Link from 'next/link';

import styles from './header.module.scss';

const Header = ():JSX.Element => (
  <header className={styles.container}>
    <div className={styles.content}>
      <Link href="/">
        <a className={styles.logo}>
          <img src="/logo.svg" alt="logo" />
        </a>
      </Link>
    </div>
  </header>
);

export default Header;
