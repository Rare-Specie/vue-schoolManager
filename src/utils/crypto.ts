import CryptoJS from 'crypto-js'

/**
 * 使用SHA256对密码进行哈希
 * @param password 原始密码
 * @returns 哈希后的密码字符串
 */
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString()
}

/**
 * 验证密码是否匹配
 * @param password 原始密码
 * @param hashedPassword 哈希后的密码
 * @returns 是否匹配
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const newHash = hashPassword(password)
  return newHash === hashedPassword
}

/**
 * 生成随机盐值（用于后端存储时增加安全性）
 * @returns 随机盐值
 */
export function generateSalt(): string {
  return CryptoJS.lib.WordArray.random(16).toString()
}

/**
 * 使用盐值对密码进行哈希（推荐用于后端存储）
 * @param password 原始密码
 * @param salt 盐值
 * @returns 哈希后的密码
 */
export function hashPasswordWithSalt(password: string, salt: string): string {
  return CryptoJS.SHA256(password + salt).toString()
}