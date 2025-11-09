const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || 'database',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: false
    }
);

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nickname: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            len: [2, 50]
        }
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'users',
    indexes: [
        {
            fields: ['nickname']
        }
    ],
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

const Token = sequelize.define('Token', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    refreshToken: {
        type: DataTypes.TEXT,
        unique: true,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'tokens',
    timestamps: false
});

const Conversation = sequelize.define('Conversation', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    user1Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    user2Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    lastMessage: DataTypes.TEXT,
    lastMessageAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'conversations',
    indexes: [
        {
            fields: ['user1Id', 'user2Id'],
            unique: true
        },
        {
            fields: ['user1Id']
        },
        {
            fields: ['user2Id']
        },
        {
            fields: ['lastMessageAt']
        }
    ]
});

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    messageType: {
        type: DataTypes.ENUM('text', 'image', 'file', 'voice'),
        defaultValue: 'text'
    },
    fileUrl: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    mimeType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isEdited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isDeleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'conversations',
            key: 'id'
        }
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'messages',
    indexes: [
        {
            fields: ['conversationId', 'createdAt']
        },
        {
            fields: ['senderId']
        }
    ]
});

User.hasMany(Token, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(Message, { foreignKey: 'senderId', onDelete: 'CASCADE' });
User.hasMany(Conversation, { foreignKey: 'user1Id', as: 'conversationsAsUser1' });
User.hasMany(Conversation, { foreignKey: 'user2Id', as: 'conversationsAsUser2' });

Token.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE' });

Conversation.belongsTo(User, { foreignKey: 'user1Id', as: 'user1' });
Conversation.belongsTo(User, { foreignKey: 'user2Id', as: 'user2' });
Conversation.hasMany(Message, { foreignKey: 'conversationId', onDelete: 'CASCADE' });

Message.belongsTo(Conversation, { foreignKey: 'conversationId', onDelete: 'CASCADE' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender', onDelete: 'CASCADE' });

async function clearDatabase() {
    try {
        console.log('Начинаем очистку базы данных...');

        const result = await sequelize.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
        `);

        const tables = result[0].map(row => row.table_name).filter(table => !table.includes('sequelize'));

        if (tables.length === 0) {
            console.log('Таблицы не найдены, база уже пустая');
            return;
        }

        await sequelize.query('SET CONSTRAINTS ALL DEFERRED');

        for (const table of tables) {
            await sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
            console.log(`Таблица ${table} удалена`);
        }

        await sequelize.query('SET CONSTRAINTS ALL IMMEDIATE');

        console.log('База данных полностью очищена!');
    } catch (error) {
        console.error('Ошибка при очистке базы:', error.message);
        throw error;
    }
}

async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL подключен!');

        await sequelize.sync({ alter: true });
        console.log('Таблицы синхронизированы!');

    } catch (error) {
        console.error('Ошибка базы данных:', error.message);
        process.exit(1);
    }
}

async function closeDatabase() {
    try {
        await sequelize.close();
        console.log('Соединение с базой данных закрыто!');
    } catch (error) {
        console.error('Ошибка при закрытии соединения:', error.message);
    }
}

module.exports = {
    sequelize,
    User,
    Token,
    Conversation,
    Message,
    initializeDatabase,
    closeDatabase,
    clearDatabase
};