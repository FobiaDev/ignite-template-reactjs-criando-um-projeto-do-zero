import {
  GetStaticPaths, GetStaticProps, GetStaticPropsContext, InferGetStaticPropsType, NextPage,
} from 'next';
import Head from 'next/head';

import { useRouter } from 'next/router';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { RichText } from 'prismic-dom';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const { results } = await prismic.getByType('post', {
    pageSize: 5,
    page: 1,
    orderings: ['document.first_publication_date desc'],
  });

  const paths = results.map(({ uid }) => ({ params: { slug: uid } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async (
  { params }: GetStaticPropsContext,
) => {
  const { slug } = params;

  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('post', String(slug), {
    graphQuery: `
    {
      post {
        title
        subtitle
        author
        banner
        content {
          heading
          body
        }
      }
    }
  `,
  });

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content,
    },
  };

  return {
    props: {
      post,
    },
  };
};

const Post: NextPage<PostProps> = ({ post }: InferGetStaticPropsType<typeof getStaticProps>) => {
  const router = useRouter();

  const readingTime = post.data.content.reduce((total, item) => {
    const wordsLength = item.body.map(
      (textItem) => textItem.text.split(' ').length,
    );
    const time = Math.ceil(
      wordsLength.reduce((acc, wordLength) => acc + wordLength, 0) / 200,
    );

    return total + time;
  }, 0);

  if (router.isFallback) {
    return (
      <>
        <Head>
          <title>Spacetraveling</title>
        </Head>
        <div>Carregando...</div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{post?.data.title} | Spacetraveling</title>
      </Head>

      <Header />

      <img src={post.data.banner.url} alt={post.data.banner.url} className={styles.banner} />

      <main className={`${commonStyles.main} ${styles.post}`}>
        <h1>{post.data.title}</h1>

        <div className={`${commonStyles.icons} ${styles.icons}`}>
          <div>
            <FiCalendar size={20} />
            <time>{format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR })}</time>
          </div>

          <div>
            <FiUser size={20} />
            <span>{post.data.author}</span>
          </div>

          <div>
            <FiClock size={20} />
            <span>{readingTime} min</span>
          </div>
        </div>

        {post.data.content.map((item) => (
          <article className={styles.content} key={item.heading}>
            <h2>{item.heading}</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(item.body),
              }}
            />
          </article>
        ))}
      </main>
    </>
  );
};

export default Post;
