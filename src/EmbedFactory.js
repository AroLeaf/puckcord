import Discord from 'discord.js';
import MessageContent from './MessageContent.js';
import XRegExp from 'xregexp';

Discord.Message.prototype.embed = function (data) { return this.client.embeds.create(data) }
Discord.Message.prototype.markdown = function (data) { return this.client.embeds.markdown(data) }

const regex = {
  meta: XRegExp('^[^\\S\\r\\n]*::([^]*)', 'm'),
  image: XRegExp('img:([^\\s]*)'),
  thumbnail: XRegExp('tmb:([^\\s]*)'),
  color: XRegExp('clr:0x([0-9a-f]+)'),
  timestamp: XRegExp('tm:(\\d+)'),
  author: XRegExp('aut:(!\\[(\\[(?<texta>.*)\\]\\((?<urla>.*)\\)|(?<textb>.*))\\]\\((?<imagea>.*)\\)|^(\\[(?<textc>.*)\\]\\((?<urlb>.*)\\)|(?<textd>.*)))', 'n'),

  parts: XRegExp('^[^\\S\\r\\n]*#', 'm'),
  url: XRegExp('\\[(?<texta>.*)\\]\\((?<urla>.*)\\)|(?<textb>.*)'),
  title: XRegExp(`^ (\\[(?<texta>.*)\\]\\((?<urla>.*)\\)|(?<textb>.*))\\n[^\\S\\r\\n]*(?<bodya>[^]*)`, 'n'),
  field: XRegExp('(?<=.)(.*)\\n[^\\S\\r\\n]*([^]*)'),
}

export default class EmbedFactory {
  constructor(options={}) {
    this.splashes = options.splashes;
    this.color = options.color;
  }

  randomSplash() {
    return this.splashes?.length ? this.splashes[Math.floor(Math.random()*this.splashes.length)] : undefined;
  }

  create(data) {
    return typeof data == 'string'
    ? this.create({ description: data }) 
    : MessageContent.embed({
      author: data.author,
      title: data.title,
      url: data.url,
      thumbnail: { url: data.thumbnail },
      description: data.description,
      image: { url: data.image },
      fields: data.fields,
      color: data.color || this.color,
      footer: data.footer || this.randomSplash(),
      timestamp: data.timestamp,
    });
  }

  markdown(markdown) {
    const [meta, body] = markdown.split(regex.meta);
    
    const image = XRegExp.exec(meta, regex.image)?.[1];
    const thumbnail = XRegExp.exec(meta, regex.thumbnail)?.[1];
    const color = XRegExp.exec(meta, regex.color)?.[1];
    const timestamp = XRegExp.exec(meta, regex.timestamp)?.[1];4

    const authorMatch = XRegExp.exec(meta, regex.author);
    const author = {
      name: authorMatch?.groups.texta || authorMatch?.groups.textb || authorMatch?.groups.textc || authorMatch?.groups.textd,
      url: authorMatch?.groups.urla || authorMatch?.groups.urlb,
      icon_url: authorMatch?.groups.imagea,
    }
  
    const parts = body.split(regex.parts);
  
    const titleMatch = XRegExp.exec(parts.shift(), regex.title);
    const title = titleMatch.groups.texta || titleMatch.groups.textb;
    const url = titleMatch.groups.urla;
    const description = titleMatch.groups.bodya;
  
    const fields = parts.map(part => {
      const [inline, name, value] = part.split(regex.field);
      return {
        name, value,
        inline: inline == '-',
      }
    });
  
    return this.create({
      image, thumbnail, color,
      timestamp: parseInt(timestamp||''),
      author, title, url, description,
      fields,
    });
  }
}