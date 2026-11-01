export const MEDIA_SCOPES = [
    'recipes',
    'tutorials',
    'avatars',
    'community',
    'ingredients',
    'user-checks',
    'general',
] as const;

export type MediaScope = (typeof MEDIA_SCOPES)[number];
