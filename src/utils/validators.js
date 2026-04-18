export const validatePost = (content) => {
    if (!content || content.trim().length === 0) throw new Error('Empty post')
    if (content.length > 5000) throw new Error('Post too long')
    return true
}
