
const { Client, GatewayIntentBits, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const mongoose = require('mongoose');
const cron = require('node-cron');

// Bot configuration
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages
    ]
});

// MongoDB Schema
const GuildSettings = mongoose.model('GuildSettings', new mongoose.Schema({
    guildId: String,
    protections: {
        guild: { enabled: Boolean, limit: Number },
        role: { enabled: Boolean, limit: Number },
        channel: { enabled: Boolean, limit: Number },
        emoji: { enabled: Boolean, limit: Number },
        sticker: { enabled: Boolean, limit: Number },
        bot: { enabled: Boolean, limit: Number },
        ban: { enabled: Boolean, limit: Number },
        kick: { enabled: Boolean, limit: Number },
        antiSwear: { enabled: Boolean },
        antiSpam: { enabled: Boolean, limit: Number },
        antiCaps: { enabled: Boolean, percentage: Number },
        antiAd: { enabled: Boolean },
        antiUrl: { enabled: Boolean },
        webMonitoring: { enabled: Boolean, url: String },
        offlineProtection: { enabled: Boolean }
    },
    whitelist: [String],
    logChannel: String,
    welcomeChannel: String,
    registerChannels: { male: String, female: String },
    roles: {
        male: String,
        female: String,
        unregistered: String,
        muted: String,
        jailed: String
    },
    tagSystem: { tag: String, enabled: Boolean },
    minAge: Number,
    webhookUrl: String
}));

const UserData = mongoose.model('UserData', new mongoose.Schema({
    userId: String,
    guildId: String,
    warnings: Number,
    invites: Number,
    registeredBy: String,
    registeredAt: Date,
    isSuspicious: Boolean,
    xp: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
    lastDaily: Date,
    isAFK: { type: Boolean, default: false },
    afkReason: String,
    afkTime: Date
}));

const InviteData = mongoose.model('InviteData', new mongoose.Schema({
    guildId: String,
    inviteCode: String,
    inviterId: String,
    uses: Number,
    createdAt: Date
}));

// Rate limiting maps
const actionCounts = new Map();
const messageCounts = new Map();

// Helper Functions
async function isWhitelisted(guildId, userId) {
    const settings = await GuildSettings.findOne({ guildId });
    return settings?.whitelist?.includes(userId) || false;
}

function incrementAction(guildId, userId, action) {
    const key = `${guildId}-${userId}-${action}`;
    const current = actionCounts.get(key) || 0;
    actionCounts.set(key, current + 1);
    
    setTimeout(() => {
        actionCounts.delete(key);
    }, 60000); // Reset after 1 minute
    
    return current + 1;
}

function createEmbed(title, description, color = 0x00ff00) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();
}

// Protection Event Handlers
client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
    const settings = await GuildSettings.findOne({ guildId: newGuild.id });
    if (!settings?.protections?.guild?.enabled) return;

    const auditLogs = await newGuild.fetchAuditLogs({ type: 1, limit: 1 });
    const log = auditLogs.entries.first();
    
    if (log && !isWhitelisted(newGuild.id, log.executor.id)) {
        const count = incrementAction(newGuild.id, log.executor.id, 'guild');
        if (count > settings.protections.guild.limit) {
            await newGuild.members.ban(log.executor.id, { reason: 'Sunucu koruma - limit aşıldı' });
        }
    }
});

client.on(Events.ChannelCreate, async (channel) => {
    const settings = await GuildSettings.findOne({ guildId: channel.guild.id });
    if (!settings?.protections?.channel?.enabled) return;

    const auditLogs = await channel.guild.fetchAuditLogs({ type: 10, limit: 1 });
    const log = auditLogs.entries.first();
    
    if (log && !isWhitelisted(channel.guild.id, log.executor.id)) {
        const count = incrementAction(channel.guild.id, log.executor.id, 'channel');
        if (count > settings.protections.channel.limit) {
            await channel.delete();
            await channel.guild.members.ban(log.executor.id, { reason: 'Kanal koruma - limit aşıldı' });
        }
    }
});

client.on(Events.ChannelDelete, async (channel) => {
    const settings = await GuildSettings.findOne({ guildId: channel.guild.id });
    if (!settings?.protections?.channel?.enabled) return;

    const auditLogs = await channel.guild.fetchAuditLogs({ type: 12, limit: 1 });
    const log = auditLogs.entries.first();
    
    if (log && !isWhitelisted(channel.guild.id, log.executor.id)) {
        const count = incrementAction(channel.guild.id, log.executor.id, 'channel');
        if (count > settings.protections.channel.limit) {
            await channel.guild.members.ban(log.executor.id, { reason: 'Kanal koruma - limit aşıldı' });
        }
    }
});

client.on(Events.GuildRoleCreate, async (role) => {
    const settings = await GuildSettings.findOne({ guildId: role.guild.id });
    if (!settings?.protections?.role?.enabled) return;

    const auditLogs = await role.guild.fetchAuditLogs({ type: 30, limit: 1 });
    const log = auditLogs.entries.first();
    
    if (log && !isWhitelisted(role.guild.id, log.executor.id)) {
        const count = incrementAction(role.guild.id, log.executor.id, 'role');
        if (count > settings.protections.role.limit) {
            await role.delete();
            await role.guild.members.ban(log.executor.id, { reason: 'Rol koruma - limit aşıldı' });
        }
    }
});

client.on(Events.GuildRoleDelete, async (role) => {
    const settings = await GuildSettings.findOne({ guildId: role.guild.id });
    if (!settings?.protections?.role?.enabled) return;

    const auditLogs = await role.guild.fetchAuditLogs({ type: 32, limit: 1 });
    const log = auditLogs.entries.first();
    
    if (log && !isWhitelisted(role.guild.id, log.executor.id)) {
        const count = incrementAction(role.guild.id, log.executor.id, 'role');
        if (count > settings.protections.role.limit) {
            await role.guild.members.ban(log.executor.id, { reason: 'Rol koruma - limit aşıldı' });
        }
    }
});

client.on(Events.GuildEmojiCreate, async (emoji) => {
    const settings = await GuildSettings.findOne({ guildId: emoji.guild.id });
    if (!settings?.protections?.emoji?.enabled) return;

    const auditLogs = await emoji.guild.fetchAuditLogs({ type: 60, limit: 1 });
    const log = auditLogs.entries.first();
    
    if (log && !(await isWhitelisted(emoji.guild.id, log.executor.id))) {
        const count = incrementAction(emoji.guild.id, log.executor.id, 'emoji');
        if (count > settings.protections.emoji.limit) {
            await emoji.delete();
            await emoji.guild.members.ban(log.executor.id, { reason: 'Emoji koruma - limit aşıldı' });
        }
    }
});

// Sticker Protection
client.on(Events.GuildStickerCreate, async (sticker) => {
    const settings = await GuildSettings.findOne({ guildId: sticker.guild.id });
    if (!settings?.protections?.sticker?.enabled) return;

    const auditLogs = await sticker.guild.fetchAuditLogs({ type: 90, limit: 1 });
    const log = auditLogs.entries.first();
    
    if (log && !(await isWhitelisted(sticker.guild.id, log.executor.id))) {
        const count = incrementAction(sticker.guild.id, log.executor.id, 'sticker');
        if (count > settings.protections.sticker.limit) {
            await sticker.delete();
            await sticker.guild.members.ban(log.executor.id, { reason: 'Sticker koruma - limit aşıldı' });
        }
    }
});

client.on(Events.GuildStickerDelete, async (sticker) => {
    const settings = await GuildSettings.findOne({ guildId: sticker.guild.id });
    if (!settings?.protections?.sticker?.enabled) return;

    const auditLogs = await sticker.guild.fetchAuditLogs({ type: 91, limit: 1 });
    const log = auditLogs.entries.first();
    
    if (log && !(await isWhitelisted(sticker.guild.id, log.executor.id))) {
        const count = incrementAction(sticker.guild.id, log.executor.id, 'sticker');
        if (count > settings.protections.sticker.limit) {
            await sticker.guild.members.ban(log.executor.id, { reason: 'Sticker koruma - limit aşıldı' });
        }
    }
});

client.on(Events.GuildBanAdd, async (ban) => {
    const settings = await GuildSettings.findOne({ guildId: ban.guild.id });
    if (!settings?.protections?.ban?.enabled) return;

    const auditLogs = await ban.guild.fetchAuditLogs({ type: 22, limit: 1 });
    const log = auditLogs.entries.first();
    
    if (log && !isWhitelisted(ban.guild.id, log.executor.id)) {
        const count = incrementAction(ban.guild.id, log.executor.id, 'ban');
        if (count > settings.protections.ban.limit) {
            await ban.guild.members.unban(ban.user.id, 'Koruma sistemi');
            await ban.guild.members.ban(log.executor.id, { reason: 'Ban koruma - limit aşıldı' });
        }
    }
});

client.on(Events.GuildMemberRemove, async (member) => {
    const settings = await GuildSettings.findOne({ guildId: member.guild.id });
    if (!settings?.protections?.kick?.enabled) return;

    const auditLogs = await member.guild.fetchAuditLogs({ type: 20, limit: 1 });
    const log = auditLogs.entries.first();
    
    if (log && log.target.id === member.id && !isWhitelisted(member.guild.id, log.executor.id)) {
        const count = incrementAction(member.guild.id, log.executor.id, 'kick');
        if (count > settings.protections.kick.limit) {
            await member.guild.members.ban(log.executor.id, { reason: 'Kick koruma - limit aşıldı' });
        }
    }
});

client.on(Events.GuildMemberAdd, async (member) => {
    const settings = await GuildSettings.findOne({ guildId: member.guild.id });
    
    // Bot protection
    if (member.user.bot && settings?.protections?.bot?.enabled) {
        const auditLogs = await member.guild.fetchAuditLogs({ type: 28, limit: 1 });
        const log = auditLogs.entries.first();
        
        if (log && !(await isWhitelisted(member.guild.id, log.executor.id))) {
            await member.kick('Bot koruma aktif');
            await member.guild.members.ban(log.executor.id, { reason: 'Yetkisiz bot ekleme' });
            return;
        }
    }

    // Invite tracking
    try {
        const invites = await member.guild.invites.fetch();
        const cachedInvites = await InviteData.find({ guildId: member.guild.id });
        
        for (const invite of invites.values()) {
            const cachedInvite = cachedInvites.find(inv => inv.inviteCode === invite.code);
            if (cachedInvite && invite.uses > cachedInvite.uses) {
                // Update inviter's count
                await UserData.updateOne(
                    { userId: invite.inviter.id, guildId: member.guild.id },
                    { $inc: { invites: 1 } },
                    { upsert: true }
                );
                
                // Update cached invite uses
                await InviteData.updateOne(
                    { guildId: member.guild.id, inviteCode: invite.code },
                    { uses: invite.uses }
                );
                
                // Send invite notification
                if (settings?.welcomeChannel) {
                    const channel = member.guild.channels.cache.get(settings.welcomeChannel);
                    if (channel) {
                        channel.send(`${member.user.tag} sunucuya ${invite.inviter.tag} tarafından davet edildi!`);
                    }
                }
                break;
            }
        }
    } catch (error) {
        console.error('Invite tracking error:', error);
    }

    // Age check
    if (settings?.minAge) {
        const accountAge = Date.now() - member.user.createdTimestamp;
        const minAgeMs = settings.minAge * 24 * 60 * 60 * 1000;
        
        if (accountAge < minAgeMs) {
            await UserData.updateOne(
                { userId: member.id, guildId: member.guild.id },
                { isSuspicious: true },
                { upsert: true }
            );
            
            if (settings?.logChannel) {
                const logChannel = member.guild.channels.cache.get(settings.logChannel);
                if (logChannel) {
                    const embed = createEmbed(
                        '⚠️ Şüpheli Hesap',
                        `${member.user.tag} şüpheli bir hesap! Hesap yaşı: ${Math.floor(accountAge / (1000 * 60 * 60 * 24))} gün`,
                        0xff9900
                    );
                    logChannel.send({ embeds: [embed] });
                }
            }
        }
    }

    // Welcome system
    if (settings?.welcomeChannel) {
        const channel = member.guild.channels.cache.get(settings.welcomeChannel);
        if (channel) {
            const embed = createEmbed(
                '🎉 Hoş Geldin!',
                `${member.user.tag} sunucumuza hoş geldin! Kayıt olmak için kayıt kanallarını kullan.`,
                0x00ff00
            );
            await channel.send({ embeds: [embed] });
        }
    }

    // Auto role for unregistered
    if (settings?.roles?.unregistered) {
        const role = member.guild.roles.cache.get(settings.roles.unregistered);
        if (role) {
            await member.roles.add(role);
        }
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    
    const settings = await GuildSettings.findOne({ guildId: message.guild?.id });
    if (!settings) return;

    // XP System
    const xpGain = Math.floor(Math.random() * 15) + 5; // 5-20 XP arası
    const userData = await UserData.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { 
            $inc: { xp: xpGain, messageCount: 1 },
            $set: { isAFK: false, afkReason: null, afkTime: null }
        },
        { upsert: true, new: true }
    );

    // Level up check
    const oldLevel = Math.floor((userData.xp - xpGain) / 1000);
    const newLevel = Math.floor(userData.xp / 1000);
    
    if (newLevel > oldLevel) {
        const levelEmbed = createEmbed(
            '🎉 Seviye Atladı!',
            `Tebrikler ${message.author}! **Seviye ${newLevel}** oldun! 🎊`,
            0xffd700
        );
        message.channel.send({ embeds: [levelEmbed] });
    }

    // AFK Check
    if (userData.isAFK) {
        await UserData.updateOne(
            { userId: message.author.id, guildId: message.guild.id },
            { $set: { isAFK: false, afkReason: null, afkTime: null } }
        );
        
        message.channel.send(`Hoş geldin ${message.author}! AFK modundan çıktın.`).then(msg => {
            setTimeout(() => msg.delete(), 5000);
        });
    }

    // Check if message mentions AFK users
    const mentionedUsers = message.mentions.users;
    for (const user of mentionedUsers.values()) {
        const mentionedUserData = await UserData.findOne({ 
            userId: user.id, 
            guildId: message.guild.id,
            isAFK: true 
        });
        
        if (mentionedUserData) {
            const afkDuration = Math.floor((Date.now() - mentionedUserData.afkTime) / 1000 / 60);
            message.reply(`${user.tag} şu anda AFK: **${mentionedUserData.afkReason}** (${afkDuration} dakika önce)`).then(msg => {
                setTimeout(() => msg.delete(), 10000);
            });
        }
    }

    // Spam protection
    if (settings.protections.antiSpam?.enabled) {
        const key = `${message.guild.id}-${message.author.id}`;
        const count = messageCounts.get(key) || 0;
        messageCounts.set(key, count + 1);
        
        setTimeout(() => {
            messageCounts.delete(key);
        }, 5000);
        
        if (count > settings.protections.antiSpam.limit) {
            await message.delete();
            await message.member.timeout(300000, 'Spam koruma');
            return;
        }
    }

    // Caps protection
    if (settings.protections.antiCaps?.enabled) {
        const capsPercentage = (message.content.match(/[A-Z]/g) || []).length / message.content.length * 100;
        if (capsPercentage > settings.protections.antiCaps.percentage) {
            await message.delete();
            await message.channel.send(`${message.author}, lütfen çok fazla büyük harf kullanma!`);
            return;
        }
    }

    // Swear protection
    if (settings.protections.antiSwear?.enabled) {
        const swearWords = ['küfür1', 'küfür2', 'amk', 'orospu', 'piç']; // Add more
        if (swearWords.some(word => message.content.toLowerCase().includes(word))) {
            await message.delete();
            await message.channel.send(`${message.author}, küfür etmek yasak!`);
            return;
        }
    }

    // Advertisement protection
    if (settings.protections.antiAd?.enabled) {
        const adPatterns = [/discord\.gg\/\w+/, /discordapp\.com\/invite\/\w+/, /\.tk/, /\.ml/, /\.ga/];
        if (adPatterns.some(pattern => pattern.test(message.content))) {
            await message.delete();
            await message.channel.send(`${message.author}, reklam yasak!`);
            return;
        }
    }

    // URL protection
    if (settings.protections.antiUrl?.enabled) {
        const urlPattern = /(https?:\/\/[^\s]+)/g;
        if (urlPattern.test(message.content)) {
            await message.delete();
            await message.channel.send(`${message.author}, link paylaşmak yasak!`);
            return;
        }
    }
});

// Command Handler
client.on(Events.MessageCreate, async (message) => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).split(' ');
    const command = args.shift().toLowerCase();

    // Registration commands
    if (command === 'erkek' && message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        const user = message.mentions.members.first();
        if (!user) return message.reply('Bir kullanıcı etiketlemelisin!');

        const settings = await GuildSettings.findOne({ guildId: message.guild.id });
        if (!settings?.roles?.male) return message.reply('Erkek rolü ayarlanmamış!');

        const maleRole = message.guild.roles.cache.get(settings.roles.male);
        const unregRole = message.guild.roles.cache.get(settings.roles.unregistered);

        if (unregRole) await user.roles.remove(unregRole);
        if (maleRole) await user.roles.add(maleRole);

        await UserData.updateOne(
            { userId: user.id, guildId: message.guild.id },
            { registeredBy: message.author.id, registeredAt: new Date() },
            { upsert: true }
        );

        message.reply(`${user.user.tag} başarıyla erkek olarak kaydedildi!`);
    }

    if (command === 'kadın' && message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        const user = message.mentions.members.first();
        if (!user) return message.reply('Bir kullanıcı etiketlemelisin!');

        const settings = await GuildSettings.findOne({ guildId: message.guild.id });
        if (!settings?.roles?.female) return message.reply('Kadın rolü ayarlanmamış!');

        const femaleRole = message.guild.roles.cache.get(settings.roles.female);
        const unregRole = message.guild.roles.cache.get(settings.roles.unregistered);

        if (unregRole) await user.roles.remove(unregRole);
        if (femaleRole) await user.roles.add(femaleRole);

        await UserData.updateOne(
            { userId: user.id, guildId: message.guild.id },
            { registeredBy: message.author.id, registeredAt: new Date() },
            { upsert: true }
        );

        message.reply(`${user.user.tag} başarıyla kadın olarak kaydedildi!`);
    }

    // Moderation commands
    if (command === 'ban' && message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
        const user = message.mentions.members.first();
        const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';

        if (!user) return message.reply('Bir kullanıcı etiketlemelisin!');
        
        await user.ban({ reason });
        message.reply(`${user.user.tag} başarıyla banlandı! Sebep: ${reason}`);
    }

    if (command === 'kick' && message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        const user = message.mentions.members.first();
        const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';

        if (!user) return message.reply('Bir kullanıcı etiketlemelisin!');
        
        await user.kick(reason);
        message.reply(`${user.user.tag} başarıyla atıldı! Sebep: ${reason}`);
    }

    if (command === 'mute' && message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        const user = message.mentions.members.first();
        const time = parseInt(args[1]) || 10;
        const reason = args.slice(2).join(' ') || 'Sebep belirtilmedi';

        if (!user) return message.reply('Bir kullanıcı etiketlemelisin!');
        
        await user.timeout(time * 60 * 1000, reason);
        message.reply(`${user.user.tag} ${time} dakika susturuldu! Sebep: ${reason}`);
    }

    if (command === 'jail' && message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        const user = message.mentions.members.first();
        if (!user) return message.reply('Bir kullanıcı etiketlemelisin!');

        const settings = await GuildSettings.findOne({ guildId: message.guild.id });
        if (!settings?.roles?.jailed) return message.reply('Jail rolü ayarlanmamış!');

        const jailRole = message.guild.roles.cache.get(settings.roles.jailed);
        if (jailRole) {
            await user.roles.set([jailRole]);
            message.reply(`${user.user.tag} jail'e gönderildi!`);
        }
    }

    // Protection setup commands
    if (command === 'koruma' && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const subCommand = args[0];
        const type = args[1];
        const value = args[2];

        if (subCommand === 'aç') {
            await GuildSettings.updateOne(
                { guildId: message.guild.id },
                { $set: { [`protections.${type}.enabled`]: true } },
                { upsert: true }
            );
            message.reply(`${type} koruması açıldı!`);
        } else if (subCommand === 'kapat') {
            await GuildSettings.updateOne(
                { guildId: message.guild.id },
                { $set: { [`protections.${type}.enabled`]: false } },
                { upsert: true }
            );
            message.reply(`${type} koruması kapatıldı!`);
        } else if (subCommand === 'limit') {
            await GuildSettings.updateOne(
                { guildId: message.guild.id },
                { $set: { [`protections.${type}.limit`]: parseInt(value) } },
                { upsert: true }
            );
            message.reply(`${type} koruması limiti ${value} olarak ayarlandı!`);
        }
    }

    // Whitelist commands
    if (command === 'whitelist' && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const subCommand = args[0];
        const user = message.mentions.users.first();

        if (subCommand === 'ekle' && user) {
            await GuildSettings.updateOne(
                { guildId: message.guild.id },
                { $addToSet: { whitelist: user.id } },
                { upsert: true }
            );
            message.reply(`${user.tag} whitelist'e eklendi!`);
        } else if (subCommand === 'çıkar' && user) {
            await GuildSettings.updateOne(
                { guildId: message.guild.id },
                { $pull: { whitelist: user.id } }
            );
            message.reply(`${user.tag} whitelist'ten çıkarıldı!`);
        }
    }

    // Invite tracking commands
    if (command === 'davet' && message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        const subCommand = args[0];
        const user = message.mentions.users.first();

        if (subCommand === 'bilgi' && user) {
            const userData = await UserData.findOne({ userId: user.id, guildId: message.guild.id });
            const inviteCount = userData?.invites || 0;
            message.reply(`${user.tag} toplamda ${inviteCount} kişi davet etmiş.`);
        } else if (subCommand === 'sıfırla' && user) {
            await UserData.updateOne(
                { userId: user.id, guildId: message.guild.id },
                { $set: { invites: 0 } },
                { upsert: true }
            );
            message.reply(`${user.tag} kullanıcısının davet sayısı sıfırlandı.`);
        } else if (subCommand === 'top') {
            const topInviters = await UserData.find({ guildId: message.guild.id })
                .sort({ invites: -1 })
                .limit(10);

            let leaderboard = '🏆 **Davet Sıralaması**\n\n';
            for (let i = 0; i < topInviters.length; i++) {
                const user = await client.users.fetch(topInviters[i].userId);
                leaderboard += `${i + 1}. ${user.tag} - ${topInviters[i].invites} davet\n`;
            }

            message.reply(leaderboard);
        }
    }

    // Advanced moderation commands
    if (command === 'uyar' && message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        const user = message.mentions.members.first();
        const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';

        if (!user) return message.reply('Bir kullanıcı etiketlemelisin!');

        await UserData.updateOne(
            { userId: user.id, guildId: message.guild.id },
            { $inc: { warnings: 1 } },
            { upsert: true }
        );

        const userData = await UserData.findOne({ userId: user.id, guildId: message.guild.id });
        message.reply(`${user.user.tag} uyarıldı! Sebep: ${reason}\nToplam uyarı: ${userData.warnings}`);

        // Auto punishment for multiple warnings
        if (userData.warnings >= 3) {
            await user.timeout(600000, 'Çok fazla uyarı');
            message.channel.send(`${user.user.tag} çok fazla uyarı aldığı için 10 dakika susturuldu.`);
        }
    }

    if (command === 'uyarılar' && message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        const user = message.mentions.users.first() || message.author;
        const userData = await UserData.findOne({ userId: user.id, guildId: message.guild.id });
        const warnings = userData?.warnings || 0;
        message.reply(`${user.tag} kullanıcısının ${warnings} uyarısı var.`);
    }

    // Tag system commands
    if (command === 'tag' && message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const subCommand = args[0];
        const tagValue = args.slice(1).join(' ');

        if (subCommand === 'ayarla') {
            await GuildSettings.updateOne(
                { guildId: message.guild.id },
                { $set: { 'tagSystem.tag': tagValue, 'tagSystem.enabled': true } },
                { upsert: true }
            );
            message.reply(`Sunucu tagı "${tagValue}" olarak ayarlandı!`);
        } else if (subCommand === 'kapat') {
            await GuildSettings.updateOne(
                { guildId: message.guild.id },
                { $set: { 'tagSystem.enabled': false } }
            );
            message.reply('Tag sistemi kapatıldı!');
        }
    }

    // Vampir Köylü Game
    if (command === 'vampirköylü') {
        const gameEmbed = createEmbed(
            '🧛 Vampir Köylü Oyunu',
            'Oyun başlatılıyor... Katılmak için 👥 butonuna basın!\n\n**Oyun Kuralları:**\n🧛 Vampirler geceleri köylüleri öldürür\n👥 Köylüler gündüz vampirleri bulup asar\n🎯 Hedef: Karşı takımı tamamen yok etmek',
            0xff0000
        );

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('join_game')
                    .setLabel('Oyuna Katıl')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('👥'),
                new ButtonBuilder()
                    .setCustomId('start_game')
                    .setLabel('Oyunu Başlat')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🎮')
            );

        await message.channel.send({ embeds: [gameEmbed], components: [row] });
    }

    // Server stats command
    if (command === 'stats') {
        const guild = message.guild;
        const settings = await GuildSettings.findOne({ guildId: guild.id });
        
        const embed = createEmbed(
            '📊 Sunucu İstatistikleri',
            `**Üye Sayısı:** ${guild.memberCount}\n` +
            `**Kanal Sayısı:** ${guild.channels.cache.size}\n` +
            `**Rol Sayısı:** ${guild.roles.cache.size}\n` +
            `**Emoji Sayısı:** ${guild.emojis.cache.size}\n` +
            `**Sunucu Yaşı:** ${Math.floor((Date.now() - guild.createdTimestamp) / (1000 * 60 * 60 * 24))} gün\n` +
            `**Koruma Durumu:** ${settings ? '✅ Aktif' : '❌ Pasif'}`,
            0x0099ff
        );

        message.reply({ embeds: [embed] });
    }

    // Gelişmiş Moderasyon Komutları
    if (command === 'tempmute' && message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        const user = message.mentions.members.first();
        const duration = args[1];
        const reason = args.slice(2).join(' ') || 'Sebep belirtilmedi';

        if (!user || !duration) return message.reply('Kullanım: !tempmute @kullanıcı süre(dakika) sebep');

        const durationMs = parseInt(duration) * 60 * 1000;
        if (durationMs > 2419200000) return message.reply('Maksimum susturma süresi 28 gündür!');

        await user.timeout(durationMs, reason);
        message.reply(`${user.user.tag} ${duration} dakika geçici olarak susturuldu!`);

        // Log the action
        const settings = await GuildSettings.findOne({ guildId: message.guild.id });
        if (settings?.logChannel) {
            const logChannel = message.guild.channels.cache.get(settings.logChannel);
            if (logChannel) {
                const embed = createEmbed(
                    '🔇 Geçici Susturma',
                    `**Susturulan:** ${user.user.tag}\n**Yetkili:** ${message.author.tag}\n**Süre:** ${duration} dakika\n**Sebep:** ${reason}`,
                    0xff9900
                );
                logChannel.send({ embeds: [embed] });
            }
        }
    }

    if (command === 'unmute' && message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        const user = message.mentions.members.first();
        if (!user) return message.reply('Bir kullanıcı etiketlemelisin!');

        await user.timeout(null);
        message.reply(`${user.user.tag} susturması kaldırıldı!`);
    }

    if (command === 'slowmode' && message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        const seconds = parseInt(args[0]) || 0;
        if (seconds > 21600) return message.reply('Maksimum yavaş mod süresi 6 saattir!');

        await message.channel.setRateLimitPerUser(seconds);
        message.reply(`Kanalda yavaş mod ${seconds} saniye olarak ayarlandı!`);
    }

    if (command === 'lock' && message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: false
        });
        message.reply('🔒 Kanal kilitlendi!');
    }

    if (command === 'unlock' && message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
            SendMessages: null
        });
        message.reply('🔓 Kanal kilidi açıldı!');
    }

    // Seviye Sistemi
    if (command === 'seviye') {
        const targetUser = message.mentions.users.first() || message.author;
        const userData = await UserData.findOne({ userId: targetUser.id, guildId: message.guild.id });
        
        const xp = userData?.xp || 0;
        const level = Math.floor(xp / 1000);
        const nextLevelXp = (level + 1) * 1000;
        const progress = ((xp % 1000) / 1000) * 100;

        const embed = createEmbed(
            `📊 ${targetUser.tag} - Seviye Bilgisi`,
            `**Seviye:** ${level}\n**XP:** ${xp}/${nextLevelXp}\n**İlerleme:** ${progress.toFixed(1)}%\n**Toplam Mesaj:** ${userData?.messageCount || 0}`,
            0x00ff00
        );

        message.reply({ embeds: [embed] });
    }

    if (command === 'leaderboard' || command === 'top') {
        const topUsers = await UserData.find({ guildId: message.guild.id })
            .sort({ xp: -1 })
            .limit(10);

        let leaderboard = '🏆 **XP Sıralaması**\n\n';
        for (let i = 0; i < topUsers.length; i++) {
            try {
                const user = await client.users.fetch(topUsers[i].userId);
                const level = Math.floor(topUsers[i].xp / 1000);
                leaderboard += `${i + 1}. ${user.tag} - Seviye ${level} (${topUsers[i].xp} XP)\n`;
            } catch (error) {
                leaderboard += `${i + 1}. Bilinmeyen Kullanıcı - Seviye ${Math.floor(topUsers[i].xp / 1000)} (${topUsers[i].xp} XP)\n`;
            }
        }

        const embed = createEmbed('📈 Liderlik Tablosu', leaderboard, 0xffd700);
        message.reply({ embeds: [embed] });
    }

    // Ekonomi Sistemi
    if (command === 'bakiye' || command === 'balance') {
        const targetUser = message.mentions.users.first() || message.author;
        const userData = await UserData.findOne({ userId: targetUser.id, guildId: message.guild.id });
        const balance = userData?.coins || 0;

        const embed = createEmbed(
            `💰 ${targetUser.tag} - Bakiye`,
            `**Coin:** ${balance} 🪙`,
            0xffd700
        );

        message.reply({ embeds: [embed] });
    }

    if (command === 'günlük' || command === 'daily') {
        const userId = message.author.id;
        const userData = await UserData.findOne({ userId, guildId: message.guild.id });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastDaily = userData?.lastDaily || new Date(0);
        
        if (lastDaily >= today) {
            return message.reply('Günlük ödülünü zaten aldın! Yarın tekrar gel.');
        }

        const dailyAmount = Math.floor(Math.random() * 500) + 100; // 100-600 arası
        
        await UserData.updateOne(
            { userId, guildId: message.guild.id },
            { 
                $inc: { coins: dailyAmount },
                $set: { lastDaily: new Date() }
            },
            { upsert: true }
        );

        const embed = createEmbed(
            '🎁 Günlük Ödül',
            `Günlük ödülün: **${dailyAmount}** 🪙\nYarın tekrar gelebilirsin!`,
            0x00ff00
        );

        message.reply({ embeds: [embed] });
    }

    if (command === 'transfer') {
        const targetUser = message.mentions.users.first();
        const amount = parseInt(args[1]);

        if (!targetUser || !amount || amount <= 0) {
            return message.reply('Kullanım: !transfer @kullanıcı miktar');
        }

        const senderData = await UserData.findOne({ userId: message.author.id, guildId: message.guild.id });
        const senderBalance = senderData?.coins || 0;

        if (senderBalance < amount) {
            return message.reply('Yetersiz bakiye!');
        }

        await UserData.updateOne(
            { userId: message.author.id, guildId: message.guild.id },
            { $inc: { coins: -amount } },
            { upsert: true }
        );

        await UserData.updateOne(
            { userId: targetUser.id, guildId: message.guild.id },
            { $inc: { coins: amount } },
            { upsert: true }
        );

        message.reply(`${amount} 🪙 başarıyla ${targetUser.tag} kullanıcısına transfer edildi!`);
    }

    

    // Anket Sistemi
    if (command === 'anket' && message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        const question = args.join(' ');
        if (!question) return message.reply('Anket sorusu yazmalısın!');

        const embed = createEmbed(
            '📊 Anket',
            `**Soru:** ${question}\n\n✅ Evet\n❌ Hayır`,
            0x0099ff
        );

        const pollMessage = await message.channel.send({ embeds: [embed] });
        await pollMessage.react('✅');
        await pollMessage.react('❌');

        message.delete();
    }

    // Giveaway Sistemi
    if (command === 'çekiliş' && message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        const time = args[0];
        const prize = args.slice(1).join(' ');

        if (!time || !prize) {
            return message.reply('Kullanım: !çekiliş süre(dakika) ödül');
        }

        const duration = parseInt(time) * 60 * 1000;
        const endTime = Date.now() + duration;

        const embed = createEmbed(
            '🎉 ÇEKİLİŞ!',
            `**Ödül:** ${prize}\n**Süre:** ${time} dakika\n**Bitiş:** <t:${Math.floor(endTime / 1000)}:R>\n\nKatılmak için 🎉 tepkisini verin!`,
            0xff0000
        );

        const giveawayMsg = await message.channel.send({ embeds: [embed] });
        await giveawayMsg.react('🎉');

        setTimeout(async () => {
            const updatedMsg = await giveawayMsg.fetch();
            const reaction = updatedMsg.reactions.cache.get('🎉');
            const users = await reaction.users.fetch();
            const participants = users.filter(u => !u.bot);

            if (participants.size === 0) {
                const endEmbed = createEmbed(
                    '🎉 Çekiliş Bitti!',
                    `**Ödül:** ${prize}\n**Kazanan:** Kimse katılmadı 😢`,
                    0x999999
                );
                return giveawayMsg.edit({ embeds: [endEmbed] });
            }

            const winner = participants.random();
            const winnerEmbed = createEmbed(
                '🎉 Çekiliş Bitti!',
                `**Ödül:** ${prize}\n**Kazanan:** ${winner}\n\nTebrikler! 🎊`,
                0x00ff00
            );

            giveawayMsg.edit({ embeds: [winnerEmbed] });
            message.channel.send(`🎉 Tebrikler ${winner}! **${prize}** kazandın!`);
        }, duration);

        message.delete();
    }

    // Rol Verme Sistemi
    if (command === 'rol-ver' && message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        const user = message.mentions.members.first();
        const roleName = args.slice(1).join(' ');

        if (!user || !roleName) {
            return message.reply('Kullanım: !rol-ver @kullanıcı rol-adı');
        }

        const role = message.guild.roles.cache.find(r => 
            r.name.toLowerCase().includes(roleName.toLowerCase())
        );

        if (!role) return message.reply('Rol bulunamadı!');

        if (user.roles.cache.has(role.id)) {
            return message.reply('Bu kullanıcının zaten bu rolü var!');
        }

        await user.roles.add(role);
        message.reply(`${user.user.tag} kullanıcısına ${role.name} rolü verildi!`);
    }

    if (command === 'rol-al' && message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        const user = message.mentions.members.first();
        const roleName = args.slice(1).join(' ');

        if (!user || !roleName) {
            return message.reply('Kullanım: !rol-al @kullanıcı rol-adı');
        }

        const role = message.guild.roles.cache.find(r => 
            r.name.toLowerCase().includes(roleName.toLowerCase())
        );

        if (!role) return message.reply('Rol bulunamadı!');

        if (!user.roles.cache.has(role.id)) {
            return message.reply('Bu kullanıcının bu rolü zaten yok!');
        }

        await user.roles.remove(role);
        message.reply(`${user.user.tag} kullanıcısından ${role.name} rolü alındı!`);
    }

    // Ticket Sistemi
    if (command === 'ticket-oluştur') {
        const ticketCategory = message.guild.channels.cache.find(c => c.name === 'tickets' && c.type === 4);
        
        const ticketChannel = await message.guild.channels.create({
            name: `ticket-${message.author.username}`,
            type: 0,
            parent: ticketCategory?.id,
            permissionOverwrites: [
                {
                    id: message.guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: message.author.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                }
            ],
        });

        const embed = createEmbed(
            '🎫 Destek Talebi',
            `${message.author}, destek talebiniz oluşturuldu!\nYetkilileri bekleyin ve sorununuzu açıklayın.\n\nTicket'ı kapatmak için \`!ticket-kapat\` yazın.`,
            0x00ff00
        );

        await ticketChannel.send({ content: `${message.author}`, embeds: [embed] });
        message.reply(`Ticket kanalınız oluşturuldu: ${ticketChannel}`);
    }

    if (command === 'ticket-kapat' && message.channel.name.startsWith('ticket-')) {
        const embed = createEmbed(
            '🎫 Ticket Kapatılıyor',
            'Bu ticket 5 saniye sonra kapatılacak...',
            0xff0000
        );

        await message.channel.send({ embeds: [embed] });
        
        setTimeout(() => {
            message.channel.delete();
        }, 5000);
    }

    // Afk Sistemi
    if (command === 'afk') {
        const reason = args.join(' ') || 'Sebep belirtilmedi';
        
        await UserData.updateOne(
            { userId: message.author.id, guildId: message.guild.id },
            { 
                $set: { 
                    isAFK: true, 
                    afkReason: reason,
                    afkTime: new Date()
                }
            },
            { upsert: true }
        );

        message.reply(`AFK moduna geçtin! Sebep: ${reason}`);
    }

    // Sunucu Bilgileri
    if (command === 'sunucu-bilgi') {
        const guild = message.guild;
        const owner = await guild.fetchOwner();
        const createdAt = Math.floor(guild.createdTimestamp / 1000);

        const embed = new EmbedBuilder()
            .setTitle(`${guild.name} - Sunucu Bilgileri`)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: '👑 Sahip', value: owner.user.tag, inline: true },
                { name: '🆔 ID', value: guild.id, inline: true },
                { name: '📅 Oluşturulma', value: `<t:${createdAt}:F>`, inline: true },
                { name: '👥 Üye Sayısı', value: `${guild.memberCount}`, inline: true },
                { name: '📺 Kanal Sayısı', value: `${guild.channels.cache.size}`, inline: true },
                { name: '🎭 Rol Sayısı', value: `${guild.roles.cache.size}`, inline: true },
                { name: '😀 Emoji Sayısı', value: `${guild.emojis.cache.size}`, inline: true },
                { name: '🔒 Doğrulama', value: guild.verificationLevel, inline: true },
                { name: '💬 Açıklama', value: guild.description || 'Açıklama yok', inline: false }
            )
            .setColor(0x0099ff)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }

    // Kullanıcı Bilgileri
    if (command === 'kullanıcı-bilgi') {
        const targetUser = message.mentions.users.first() || message.author;
        const member = message.guild.members.cache.get(targetUser.id);
        const userData = await UserData.findOne({ userId: targetUser.id, guildId: message.guild.id });

        const embed = new EmbedBuilder()
            .setTitle(`${targetUser.tag} - Kullanıcı Bilgileri`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '🆔 ID', value: targetUser.id, inline: true },
                { name: '📅 Hesap Oluşturma', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`, inline: true },
                { name: '📥 Sunucuya Giriş', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: true },
                { name: '🎭 Roller', value: member.roles.cache.map(r => r.name).slice(0, 10).join(', ') || 'Rol yok', inline: false },
                { name: '⚠️ Uyarılar', value: `${userData?.warnings || 0}`, inline: true },
                { name: '💰 Bakiye', value: `${userData?.coins || 0} 🪙`, inline: true },
                { name: '📊 Seviye', value: `${Math.floor((userData?.xp || 0) / 1000)}`, inline: true }
            )
            .setColor(member.displayHexColor || 0x0099ff)
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }

    // Mesaj Temizleme
    if (command === 'temizle' && message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        const amount = parseInt(args[0]);
        
        if (!amount || amount < 1 || amount > 100) {
            return message.reply('1-100 arası bir sayı girmelisin!');
        }

        const messages = await message.channel.bulkDelete(amount + 1, true);
        message.channel.send(`${messages.size - 1} mesaj temizlendi!`).then(msg => {
            setTimeout(() => msg.delete(), 3000);
        });
    }

    // Avatar Komutu
    if (command === 'avatar' || command === 'pp') {
        const targetUser = message.mentions.users.first() || message.author;
        
        const embed = createEmbed(
            `${targetUser.tag} - Avatar`,
            `[Avatar URL](${targetUser.displayAvatarURL({ size: 512 })})`,
            0x0099ff
        );
        
        embed.setImage(targetUser.displayAvatarURL({ size: 512 }));
        message.reply({ embeds: [embed] });
    }
});

// Game players storage
const gameData = new Map();

// Button interactions
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'join_game') {
        const gameKey = `${interaction.guild.id}-${interaction.channel.id}`;
        if (!gameData.has(gameKey)) {
            gameData.set(gameKey, { players: [], started: false });
        }

        const game = gameData.get(gameKey);
        if (game.started) {
            return interaction.reply({ content: 'Oyun zaten başlamış! ❌', ephemeral: true });
        }

        if (!game.players.includes(interaction.user.id)) {
            game.players.push(interaction.user.id);
            await interaction.reply({ 
                content: `Oyuna katıldın! 🎮 Toplam oyuncu: ${game.players.length}`, 
                ephemeral: true 
            });
        } else {
            await interaction.reply({ 
                content: 'Zaten oyuna katıldın! ✅', 
                ephemeral: true 
            });
        }
    }

    if (interaction.customId === 'start_game') {
        const gameKey = `${interaction.guild.id}-${interaction.channel.id}`;
        const game = gameData.get(gameKey);

        if (!game || game.players.length < 4) {
            return interaction.reply({ 
                content: 'Oyun başlatmak için en az 4 oyuncu gerekli! ❌', 
                ephemeral: true 
            });
        }

        if (game.started) {
            return interaction.reply({ 
                content: 'Oyun zaten başlamış! ❌', 
                ephemeral: true 
            });
        }

        game.started = true;
        
        // Assign roles randomly
        const vampireCount = Math.floor(game.players.length / 3);
        const roles = ['🧛 Vampir'.repeat(vampireCount), '👥 Köylü'.repeat(game.players.length - vampireCount)].join('').split('');
        
        // Shuffle roles
        for (let i = roles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [roles[i], roles[j]] = [roles[j], roles[i]];
        }

        // Send roles to players
        for (let i = 0; i < game.players.length; i++) {
            const player = await interaction.guild.members.fetch(game.players[i]);
            try {
                await player.send(`🎮 Vampir Köylü oyununda rolün: **${roles[i]}**\n\nOyun ${interaction.channel} kanalında başladı!`);
            } catch (error) {
                console.log(`DM gönderilemedi: ${player.user.tag}`);
            }
        }

        const embed = createEmbed(
            '🎮 Oyun Başladı!',
            `Vampir Köylü oyunu başladı! ${game.players.length} oyuncu katıldı.\n\n` +
            `🧛 ${vampireCount} Vampir vs 👥 ${game.players.length - vampireCount} Köylü\n\n` +
            'Oyuncular rollerini DM olarak aldı. Oyun başlasın!',
            0x00ff00
        );

        await interaction.update({ embeds: [embed], components: [] });
    }
});

// Auto backup system
cron.schedule('0 0 * * *', async () => {
    console.log('Otomatik yedekleme başlatılıyor...');
    
    for (const guild of client.guilds.cache.values()) {
        try {
            const settings = await GuildSettings.findOne({ guildId: guild.id });
            if (!settings) continue;

            // Backup channels
            const channelBackup = guild.channels.cache.map(channel => ({
                id: channel.id,
                name: channel.name,
                type: channel.type,
                position: channel.position,
                parentId: channel.parentId
            }));

            // Backup roles
            const roleBackup = guild.roles.cache.map(role => ({
                id: role.id,
                name: role.name,
                color: role.color,
                permissions: role.permissions.bitfield,
                position: role.position
            }));

            // Save to database
            await GuildSettings.updateOne(
                { guildId: guild.id },
                { 
                    $set: { 
                        lastBackup: new Date(),
                        channelBackup,
                        roleBackup
                    }
                }
            );

            console.log(`✅ ${guild.name} sunucusu yedeklendi`);
        } catch (error) {
            console.error(`❌ ${guild.name} yedekleme hatası:`, error);
        }
    }
});

// Web monitoring
cron.schedule('*/5 * * * *', async () => {
    const axios = require('axios');
    
    const guildsWithWebMonitoring = await GuildSettings.find({ 
        'protections.webMonitoring.enabled': true 
    });

    for (const guildSettings of guildsWithWebMonitoring) {
        try {
            const guild = client.guilds.cache.get(guildSettings.guildId);
            if (!guild) continue;

            const url = guildSettings.protections.webMonitoring.url;
            if (!url) continue;

            const response = await axios.get(url, { timeout: 10000 });
            
            if (response.status !== 200) {
                if (guildSettings.logChannel) {
                    const channel = guild.channels.cache.get(guildSettings.logChannel);
                    if (channel) {
                        const embed = createEmbed(
                            '🌐 Web Sitesi Sorunu',
                            `${url} adresine erişilemiyor! Status: ${response.status}`,
                            0xff0000
                        );
                        channel.send({ embeds: [embed] });
                    }
                }
            }
        } catch (error) {
            console.error('Web monitoring error:', error);
            
            const guild = client.guilds.cache.get(guildSettings.guildId);
            if (guild && guildSettings.logChannel) {
                const channel = guild.channels.cache.get(guildSettings.logChannel);
                if (channel) {
                    const embed = createEmbed(
                        '🌐 Web Sitesi Çevrimdışı',
                        `${guildSettings.protections.webMonitoring.url} adresine erişilemiyor!`,
                        0xff0000
                    );
                    channel.send({ embeds: [embed] });
                }
            }
        }
    }
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/discordbot')
    .then(() => console.log('MongoDB bağlantısı başarılı'))
    .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Bot login
client.login(process.env.DISCORD_TOKEN);

client.once(Events.ClientReady, () => {
    console.log(`Bot ${client.user.tag} olarak giriş yaptı!`);
    client.user.setActivity('Sunucuyu koruyorum 🛡️', { type: 'WATCHING' });
});

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.on('error', error => {
    console.error('Discord client error:', error);
});
