import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Paragraph,
  Packer,
  TextRun,
} from 'docx';

function inlineRuns(text) {
  const tokens = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*(.+?)\*\*|\*([^*]+?)\*|`([^`]+)`/g;
  const runs = [];
  let offset = 0;
  for (const match of text.matchAll(tokens)) {
    if (match.index > offset) runs.push(new TextRun(text.slice(offset, match.index)));
    if (match[2]) {
      runs.push(new ExternalHyperlink({
        link: match[2],
        children: [new TextRun({ text: match[1], style: 'Hyperlink' })],
      }));
    } else if (match[3]) {
      runs.push(new TextRun({ text: match[3], bold: true }));
    } else if (match[4]) {
      runs.push(new TextRun({ text: match[4], italics: true }));
    } else {
      runs.push(new TextRun({ text: match[5], font: 'Consolas' }));
    }
    offset = match.index + match[0].length;
  }
  if (offset < text.length) runs.push(new TextRun(text.slice(offset)));
  return runs;
}

function strategyParagraphs(markdown) {
  return markdown.split(/\r?\n/).flatMap((line) => {
    if (!line.trim() || line.trim() === '---') return [];
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      return [new Paragraph({
        heading: level === 1 ? HeadingLevel.TITLE : level === 2 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
        alignment: level === 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: level === 1 ? 0 : 240, after: 120 },
        children: inlineRuns(heading[2]),
      })];
    }
    if (line.startsWith('> ')) {
      return [new Paragraph({
        indent: { left: 360 },
        spacing: { after: 120 },
        children: inlineRuns(line.slice(2)),
      })];
    }
    if (/^[-*]\s+/.test(line)) {
      return [new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 80 },
        children: inlineRuns(line.replace(/^[-*]\s+/, '')),
      })];
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      return [new Paragraph({
        numbering: { reference: 'strategy-numbering', level: 0 },
        spacing: { after: 80 },
        children: inlineRuns(line.replace(/^\s*\d+\.\s+/, '')),
      })];
    }
    return [new Paragraph({
      spacing: { after: 120 },
      children: inlineRuns(line),
    })];
  });
}

export async function buildStrategyDocx(markdown) {
  if (typeof markdown !== 'string' || !markdown.trim()) {
    throw new Error('A generated Test Strategy is required to create a Word document.');
  }
  const document = new Document({
    creator: 'AI Test Strategy Generator',
    title: markdown.match(/^#\s+(.+)$/m)?.[1] || 'Test Strategy',
    description: 'Draft Test Strategy — pending human review',
    numbering: {
      config: [{
        reference: 'strategy-numbering',
        levels: [{
          level: 0,
          format: 'decimal',
          text: '%1.',
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      }],
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 900, right: 1080, bottom: 900, left: 1080 },
        },
      },
      children: strategyParagraphs(markdown),
    }],
  });
  return Packer.toBuffer(document);
}
