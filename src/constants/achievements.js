export const ACHIEVEMENT_META = {
  'movie-marathon-i': {
    title: 'Movie Marathon I',
    image: '/badge1.png',
  },
  'movie-marathon-ii': {
    title: 'Movie Marathon II',
    image: '/badge1.png',
  },
  'discussion-spark': {
    title: 'Discussion Spark',
    image: '/badge1.png',
  },
  'upvote-magnet': {
    title: 'Upvote Magnet',
    image: '/badge1.png',
  },
};

export function getBadgeMeta(badgeId) {
  return ACHIEVEMENT_META[badgeId] || null;
}

