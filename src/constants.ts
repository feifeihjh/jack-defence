export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const ROCKET_SPEED_MIN = 0.5;
export const ROCKET_SPEED_MAX = 0.5;
export const INTERCEPTOR_SPEED = 14;

export const EXPLOSION_MAX_RADIUS = 55;
export const EXPLOSION_GROW_SPEED = 2.0;
export const EXPLOSION_FADE_SPEED = 0.02;

export const SCORE_PER_ROCKET = 20;
export const WIN_SCORE = 500;

export const INITIAL_AMMO = {
  left: 60,
  middle: 80,
  right: 60,
};

export const TRANSLATIONS = {
  en: {
    title: 'Jack Nova Defense',
    start: 'Start Defense',
    restart: 'Play Again',
    win: 'Mission Accomplished!',
    loss: 'Defense Failed',
    score: 'Score',
    ammo: 'Ammo',
    instructions: 'Click anywhere to launch interceptors. Protect your cities!',
    winMsg: 'You saved the colony!',
    lossMsg: 'All batteries destroyed. The cities have fallen.',
  },
  zh: {
    title: 'Jack新星防御',
    start: '开始防御',
    restart: '再玩一次',
    win: '任务完成！',
    loss: '防御失败',
    score: '得分',
    ammo: '弹药',
    instructions: '点击屏幕发射拦截导弹。保护你的城市！',
    winMsg: '你成功保卫了殖民地！',
    lossMsg: '所有炮台已被摧毁。城市陷落了。',
  }
};
