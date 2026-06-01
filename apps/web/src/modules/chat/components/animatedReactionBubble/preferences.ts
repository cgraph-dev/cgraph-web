export function getReactionStyleClass(reactionStyle: string): string {
  const reactionClassMap: Record<string, string> = {
    bounce: 'reaction-bounce',
    pop: 'reaction-pop',
    float: 'reaction-float',
    spin: 'reaction-spin',
    pulse: 'reaction-pulse',
    shake: 'reaction-shake',
    zoom: 'reaction-zoom',
  };

  return reactionClassMap[reactionStyle] || 'reaction-bounce';
}
