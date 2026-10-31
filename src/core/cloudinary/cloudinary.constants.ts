export const CLOUDINARY_SCOPES = [
    'recipes',
    'tutorials',
    'avatars',
    'community',
    'ingredients',
    'general',
] as const;

export type CloudinaryScope = (typeof CLOUDINARY_SCOPES)[number];
