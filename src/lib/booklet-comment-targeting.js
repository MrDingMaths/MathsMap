const copy = value => JSON.parse(JSON.stringify(value));
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

export function createCommentTargeting({ contentTarget, fieldValue, feedbackText, sourceReferences, feedbackSignature }) {
  function validate(project, anchor, edition = anchor?.edition ?? 'student') {
    if (anchor == null) return null;
    if (typeof edition !== 'string' || !edition.trim()) throw Error('Choose a booklet edition before adding a comment.');
    const result = copy(anchor);
    const check = range => {
      if (typeof range?.rootId !== 'string' || !range.rootId || !contentTarget(project, range.rootId)) {
        throw Error('The comment target is no longer in this booklet. Select the intended content again.');
      }
      if (range.edition != null && range.edition !== edition) {
        throw Error('The comment selection belongs to another edition. Select the intended content again.');
      }
      if (range.pointer != null && fieldValue(project, range) === undefined) {
        throw Error('The selected comment field is no longer available. Select the intended content again.');
      }
      range.edition = edition;
    };
    check(result);
    if (result.ranges != null) {
      if (!Array.isArray(result.ranges) || !result.ranges.length) throw Error('The comment selection has no available ranges.');
      result.ranges.forEach(check);
      const first = result.ranges[0];
      if (first.rootId !== result.rootId || first.pointer !== result.pointer) {
        throw Error('The comment selection and its first range do not match. Select the intended content again.');
      }
    }
    return result;
  }

  function compatible(project, anchor, targetId, edition) {
    if (!anchor || !targetId) return false;
    const selected = contentTarget(project, targetId);
    if (!selected) return false;
    let checked;
    try { checked = validate(project, anchor, edition); } catch { return false; }
    return (checked.ranges ?? [checked]).some(range => {
      if (range.rootId === targetId) return true;
      const target = contentTarget(project, range.rootId);
      return targetId === selected.block?.id && target?.block?.id === selected.block.id;
    });
  }

  function textAnchor(selection, edition) {
    if (!selection) return null;
    const first = selection.ranges?.[0];
    if (!first) throw Error('The comment selection has no available ranges. Select the intended content again.');
    return { ...first, ranges: selection.ranges, quote: selection.quote ?? '', edition: selection.edition ?? first.edition ?? edition };
  }

  function select(project, state, targetId, edition) {
    const base = validate(project, { rootId: targetId, edition }, edition);
    let selectedText = null;
    try { selectedText = textAnchor(state.textSelection, edition); } catch { /* A new target clears an unusable prior selection. */ }
    const keepText = compatible(project, selectedText, targetId, edition);
    const keepDocument = compatible(project, state.documentSelection, targetId, edition);
    return {
      documentSelection: keepDocument ? validate(project, state.documentSelection, edition) : base,
      textSelection: keepText ? copy(state.textSelection) : null
    };
  }

  function snapshot(project, anchor, edition = anchor?.edition ?? 'student') {
    const checked = validate(project, anchor, edition);
    if (!checked) return null;
    if (!checked.quote) {
      checked.quote = (checked.ranges ?? [checked])
        .map(range => feedbackText(fieldValue(project, range)))
        .filter(Boolean).join('\n').slice(0, 220);
    }
    return freeze(checked);
  }

  function choose(project, state, targetId, edition, inlineAnchor = null) {
    if (!targetId) {
      if (inlineAnchor || state.textSelection || state.documentSelection) {
        throw Error('Select the intended content before adding a comment.');
      }
      return null;
    }
    validate(project, { rootId: targetId, edition }, edition);
    if (inlineAnchor) {
      validate(project, inlineAnchor, edition);
      if (!compatible(project, inlineAnchor, targetId, edition)) {
        throw Error('The active editor and selected comment target do not match. Select the intended content again.');
      }
      return snapshot(project, inlineAnchor, edition);
    }
    if (state.textSelection) {
      const selected = textAnchor(state.textSelection, edition);
      validate(project, selected, edition);
      if (!compatible(project, selected, targetId, edition)) {
        throw Error('The text selection and selected comment target do not match. Select the intended content again.');
      }
      return snapshot(project, selected, edition);
    }
    if (compatible(project, state.documentSelection, targetId, edition)) {
      return snapshot(project, state.documentSelection, edition);
    }
    return snapshot(project, { rootId: targetId, edition }, edition);
  }

  function context(project, anchor) {
    const checked = validate(project, anchor);
    if (!checked) return { targetId: project.id, location: 'Whole booklet', edition: 'student', quote: '', sourceRefs: [] };
    const target = contentTarget(project, checked.rootId);
    const refs = (checked.ranges ?? [checked]).flatMap(range => {
      const item = contentTarget(project, range.rootId);
      return [...sourceReferences(item?.node), ...sourceReferences(item?.block), ...sourceReferences(item?.section)];
    });
    return {
      targetId: checked.rootId,
      location: target?.block ? `${target.section.title} · ${target.block.type === 'question' ? 'Question' : target.block.sourceAtom?.label ?? target.block.type}` : 'Whole booklet',
      edition: checked.edition,
      quote: checked.quote || feedbackText(fieldValue(project, checked)).slice(0, 220),
      sourceRefs: refs.filter((ref, index) => refs.findIndex(other => other.pageNumber === ref.pageNumber) === index)
    };
  }

  function preview(project, anchor) {
    try { return { ...context(project, anchor), error: '' }; }
    catch (error) {
      return { targetId: anchor?.rootId ?? project.id, location: 'Target unavailable', edition: anchor?.edition ?? 'student', quote: anchor?.quote ?? '', sourceRefs: [], error: error.message };
    }
  }

  function record(project, anchor, note, scope, { id, at }) {
    const checked = snapshot(project, anchor);
    const details = context(project, checked);
    const value = checked ? fieldValue(project, checked) : null;
    return { id, targetId: details.targetId, note: note.trim(), resolved: false, at, scope,
      anchor: checked ? copy(checked) : null, edition: details.edition, quote: details.quote,
      signature: feedbackSignature(value), sourceRefs: details.sourceRefs, location: details.location };
  }

  return { validate, select, snapshot, choose, context, preview, record };
}

export function formatFeedbackComment(flag, index, attention = '') {
  return [
    `${index + 1}. ${flag.location ?? 'Content comment'}`,
    `Target: ${flag.targetId}${flag.anchor?.pointer ?? ''}${flag.anchor?.nodeId ? ' · node ' + flag.anchor.nodeId : ''}`,
    flag.anchor?.ranges?.length > 1 ? `Selection spans: ${flag.anchor.ranges.map(range => range.rootId + (range.pointer ?? '')).join(', ')}` : '',
    `Edition: ${flag.edition ?? 'Not recorded (legacy note)'}`,
    `Scope: ${flag.scope === 'local' ? 'This occurrence only' : 'All applicable occurrences'}`,
    flag.sourceRefs?.length ? `Source pages: ${flag.sourceRefs.map(ref => ref.pageNumber).join(', ')}` : '',
    flag.quote ? `Quoted context: ${flag.quote}` : '',
    attention ? `Attention: ${attention}` : '',
    `Comment (${flag.id}): ${flag.note}`
  ].filter(Boolean).join('\n');
}
