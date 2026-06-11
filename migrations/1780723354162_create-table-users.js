import bcrypt from 'bcrypt';

/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = async (pgm) => {
  pgm.createType('user_role', ['super admin', 'admin']);

  pgm.createTable('users', {
    id: {
      type: 'CHAR(21)',
      primaryKey: true
    },
    username: {
      type: 'VARCHAR(100)',
      notNull: true,
      unique: true
    },
    password: {
      type: 'TEXT',
      notNull: true
    },
    fullName: {
      type: 'VARCHAR(140)',
      notNull: true
    },
    role: {
      type: 'user_role',
      notNull: true,
      default: 'admin'
    },
    createdAt: {
      type: 'TIMESTAMPTZ',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    },
    updatedAt: {
      type: 'TIMESTAMPTZ',
      notNull: true,
      default: pgm.func('CURRENT_TIMESTAMP')
    }
  });

  const username = process.env.USERNAME_SUPER_ADMIN;
  const password = process.env.PASSWORD_SUPER_ADMIN;
  const hashedPassword = await bcrypt.hash(password, 10);

  pgm.sql(`
    INSERT INTO users (id, username, password, "fullName", role)
    VALUES ('user-123', '${username}', '${hashedPassword}', 'atma jaya super admin', 'super admin')
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropType('user_role');
  pgm.dropTable('users');
};
