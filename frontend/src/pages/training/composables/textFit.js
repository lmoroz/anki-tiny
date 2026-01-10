const defaultSettings = {
  minFontSize: 6,
  maxFontSize: 80,
  reProcess: true,
  widthOnly: false,
};

export function textFit(element, options) {
  // Extend options.
  const settings = Object.assign({}, defaultSettings, options);

  return processItem(element, settings);
}

/**
 * The meat. Given an el, make the text inside it fit its parent.
 * @param  {DOMElement} el       Child el.
 * @param  {Object} settings     Options for fit.
 */
function processItem(el, settings) {
  if (!isElement(el) || (!settings.reProcess && el.getAttribute('textFitted'))) {
    return;
  }

  // Set textFitted attribute so we know this was processed.
  if (!settings.reProcess) {
    el.setAttribute('textFitted', '1');
  }

  let innerSpan;
  let low, mid, high;

  // Get element data.
  const originalHTML = el.innerHTML;
  const originalWidth = innerWidth(el);
  const originalHeight = innerHeight(el);

  // Don't process if we can't find box dimensions
  if (!originalWidth || (!settings.widthOnly && !originalHeight)) {
    if (!settings.widthOnly)
      throw new Error('Set a static height and width on the target element ' + el.outerHTML + ' before using textFit!');
    else throw new Error('Set a static width on the target element ' + el.outerHTML + ' before using textFit!');
  }

  // Add textFitted span inside this container.
  if (originalHTML.indexOf('textFitted') === -1) {
    innerSpan = document.createElement('span');
    // Inline block ensure it takes on the size of its contents, even if they are enclosed
    // in other tags like <p>
    innerSpan.style['display'] = 'inline-block';
    innerSpan.classList.add('card-text');
    innerSpan.classList.add('text-center');
    innerSpan.classList.add('textFitted');
    innerSpan.innerHTML = originalHTML;
    el.innerHTML = '';
    el.appendChild(innerSpan);
  } else {
    // Reprocessing.
    const innerSpanNode = el.querySelector('span.textFitted');
    if (innerSpanNode == null) {
      throw new Error('Could not find `span.textFitted`');
    } else if (!(innerSpanNode instanceof HTMLElement)) {
      throw new Error('Element matching `span.textFitted` not a span');
    }
    innerSpan = innerSpanNode;
    // Remove vertical align if we're reprocessing.
    if (hasClass(innerSpan, 'textFitAlignVert')) {
      innerSpan.className = innerSpan.className.replace('textFitAlignVert', '');
      innerSpan.style['height'] = '';
      el.className.replace('textFitAlignVertFlex', '');
    }
  }

  low = settings.minFontSize;
  high = settings.maxFontSize;

  // Binary search for highest best fit
  let size = low;
  while (low <= high) {
    mid = (high + low) >> 1;
    innerSpan.style.fontSize = mid + 'px';
    const innerSpanBoundingClientRect = innerSpan.getBoundingClientRect();
    if (
      innerSpanBoundingClientRect.width <= originalWidth &&
      (settings.widthOnly || innerSpanBoundingClientRect.height <= originalHeight)
    ) {
      size = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
    // await injection point
  }

  // found, updating font if differs:
  if (innerSpan.style.fontSize !== size + 'px') innerSpan.style.fontSize = size + 'px';

  return size;
}

// Calculate height without padding.
function innerHeight(el) {
  const style = window.getComputedStyle(el, null);
  return (
    el.getBoundingClientRect().height -
    parseInt(style.getPropertyValue('padding-top'), 10) -
    parseInt(style.getPropertyValue('padding-bottom'), 10)
  );
}

// Calculate width without padding.
function innerWidth(el) {
  const style = window.getComputedStyle(el, null);
  return (
    el.getBoundingClientRect().width -
    parseInt(style.getPropertyValue('padding-left'), 10) -
    parseInt(style.getPropertyValue('padding-right'), 10)
  );
}

//Returns true if it is a DOM element
function isElement(o) {
  return typeof HTMLElement === 'object'
    ? o instanceof HTMLElement
    : o !== null &&
        typeof o === 'object' &&
        true &&
        'nodeType' in o &&
        o.nodeType === 1 &&
        'nodeName' in o &&
        typeof o.nodeName === 'string';
}

function hasClass(element, cls) {
  return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}
