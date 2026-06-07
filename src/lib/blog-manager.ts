import fs from 'fs';
import path from 'path';

export interface BlogPost {
  title: string;
  slug: string;
  status: 'publish' | 'draft' | 'trash';
  date: string;
  categories?: string[];
  tags?: string[];
  content: string;
}

const POSTS_FILE_PATH = path.join(
  process.cwd(),
  'src',
  'data',
  'wp-posts.json'
);

export class BlogManager {
  /**
   * ブログポストを全て読み込む
   */
  static getAllPosts(): BlogPost[] {
    try {
      const data = fs.readFileSync(POSTS_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading posts:', error);
      return [];
    }
  }

  /**
   * 特定のポストをスラッグで取得
   */
  static getPostBySlug(slug: string): BlogPost | null {
    const posts = this.getAllPosts();
    return posts.find((post) => post.slug === slug) || null;
  }

  /**
   * 複数のポストを削除（スラッグのリストで指定）
   */
  static deletePostsBySlugs(slugs: string[]): boolean {
    try {
      const posts = this.getAllPosts();
      const filtered = posts.filter((post) => !slugs.includes(post.slug));
      fs.writeFileSync(POSTS_FILE_PATH, JSON.stringify(filtered, null, 2));
      return true;
    } catch (error) {
      console.error('Error deleting posts:', error);
      return false;
    }
  }

  /**
   * ポストのステータスを更新（複数）
   */
  static updatePostsStatus(
    slugs: string[],
    newStatus: 'publish' | 'draft' | 'trash'
  ): boolean {
    try {
      const posts = this.getAllPosts();
      const updated = posts.map((post) => {
        if (slugs.includes(post.slug)) {
          return { ...post, status: newStatus };
        }
        return post;
      });
      fs.writeFileSync(POSTS_FILE_PATH, JSON.stringify(updated, null, 2));
      return true;
    } catch (error) {
      console.error('Error updating post status:', error);
      return false;
    }
  }

  /**
   * ポストのカテゴリを更新（複数）
   */
  static updatePostsCategories(
    slugs: string[],
    newCategories: string[]
  ): boolean {
    try {
      const posts = this.getAllPosts();
      const updated = posts.map((post) => {
        if (slugs.includes(post.slug)) {
          return { ...post, categories: newCategories };
        }
        return post;
      });
      fs.writeFileSync(POSTS_FILE_PATH, JSON.stringify(updated, null, 2));
      return true;
    } catch (error) {
      console.error('Error updating post categories:', error);
      return false;
    }
  }

  /**
   * 単一ポストを更新
   */
  static updatePost(slug: string, updates: Partial<BlogPost>): boolean {
    try {
      const posts = this.getAllPosts();
      const updated = posts.map((post) => {
        if (post.slug === slug) {
          return { ...post, ...updates };
        }
        return post;
      });
      fs.writeFileSync(POSTS_FILE_PATH, JSON.stringify(updated, null, 2));
      return true;
    } catch (error) {
      console.error('Error updating post:', error);
      return false;
    }
  }
}
