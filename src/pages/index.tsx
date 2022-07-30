import { GetStaticProps, InferGetStaticPropsType, NextPage } from 'next';
import Head from 'next/head';

import { useState } from 'react';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  const prismic = getPrismicClient({});
  const { next_page, results: response } = await prismic.getByType('post', {
    pageSize: 5,
    graphQuery: `{
      post {
        title
        subtitle
        author
      }
    }`,
    orderings: ['document.first_publication_date desc'],
  });

  const results = response.map(({ first_publication_date, uid, data }) => ({
    uid,
    data: {
      title: data.title,
      subtitle: data.subtitle,
      author: data.author,
    },
    first_publication_date,
  }));

  const postsPagination = {
    next_page,
    results,
  };

  return {
    props: {
      postsPagination,
    },
    revalidate: 60 * 60, // 1h
  };
};

const Home: NextPage<HomeProps> = ({
  postsPagination,
}: InferGetStaticPropsType<typeof getStaticProps>) => {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string |null>(postsPagination.next_page);

  return (
    <>
      <Head>
        <title>Home | Spacetraveling</title>
      </Head>

      <main className={`${styles.container} ${commonStyles.main}`}>
        <img src="/logo.svg" alt="logo" />
        <div className={styles.postsContainer}>
          {posts.map((post) => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a className={styles.post}>
                <strong>{post.data.title}</strong>
                <span>{post.data.subtitle}</span>
                <div className={commonStyles.icons}>
                  <div>
                    <FiCalendar size={20} />

                    <time>{format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR })}</time>
                  </div>
                  <div>
                    <FiUser size={20} />

                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
        {nextPage && (
        <button
          type="button"
          onClick={() => fetch(nextPage).then((response) => {
            response.json().then((data) => {
              const { next_page, results } = data;

              setPosts((prev) => [...prev, ...results]);
              setNextPage(next_page);
            });
          })}
        >Carregar mais posts
        </button>
        )}
      </main>
    </>
  );
};

export default Home;
