// Small DOM fixture for dependency-free runtime tests. These tests exercise the
// public academy APIs and UI state; the browser smoke test checks rendering.
import fs from 'node:fs';
import vm from 'node:vm';

class TestCustomEvent extends Event {
  constructor(type, options = {}) { super(type); this.detail = options.detail; }
}

class TestElement extends EventTarget {
  constructor(tagName, document) {
    super();
    this.tagName = tagName.toUpperCase();
    this.ownerDocument = document;
    this.children = [];
    this.parentElement = null;
    this.attributes = new Map();
    this.style = {};
    this.hidden = false;
    this.disabled = false;
    this._text = '';
    this.dataset = new Proxy({}, { set(target, key, value) { target[key] = String(value); return true; } });
    this.classList = {
      contains: name => this.className.split(/\s+/).includes(name),
      add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
      remove: (...names) => { this.className = this.className.split(/\s+/).filter(name => !names.includes(name)).join(' '); },
      toggle: (name, force) => {
        const on = force === undefined ? !this.classList.contains(name) : force;
        if (on) this.classList.add(name); else this.classList.remove(name);
        return on;
      }
    };
  }
  get className() { return this.attributes.get('class') || ''; }
  set className(value) { this.attributes.set('class', value); }
  get id() { return this.attributes.get('id') || ''; }
  set id(value) { this.attributes.set('id', value); }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this._text = String(value); this.children = []; }
  setAttribute(name, value) {
    if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = value;
    else this.attributes.set(name, String(value));
  }
  getAttribute(name) {
    if (name.startsWith('data-')) return this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] ?? null;
    return this.attributes.get(name) ?? null;
  }
  removeAttribute(name) {
    if (name.startsWith('data-')) delete this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())];
    else this.attributes.delete(name);
  }
  appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
  prepend(child) { child.parentElement = this; this.children.unshift(child); }
  replaceChildren(...children) { this._text = ''; this.children = []; children.forEach(child => this.appendChild(child)); }
  matches(selector) {
    const tag = selector.match(/^[a-z]+/i)?.[0];
    if (tag && this.tagName !== tag.toUpperCase()) return false;
    const id = selector.match(/#([\w-]+)/)?.[1];
    if (id && this.id !== id) return false;
    for (const [, name] of selector.matchAll(/\.([\w-]+)/g)) if (!this.classList.contains(name)) return false;
    for (const [, name] of selector.matchAll(/\[([\w-]+)\]/g)) if (this.getAttribute(name) === null) return false;
    return true;
  }
  querySelectorAll(selector) {
    const selectors = selector.split(',');
    const found = [];
    const visit = parent => {
      parent.children.forEach(child => {
        if (selectors.some(s => child.matches(s.trim()))) found.push(child);
        visit(child);
      });
    };
    visit(this);
    return found;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  click() { if (!this.disabled) this.dispatchEvent(new Event('click')); }
  focus() { this.ownerDocument.activeElement = this; }
}

class TestDocument extends EventTarget {
  constructor() {
    super();
    this.documentElement = new TestElement('html', this);
    this.head = new TestElement('head', this);
    this.body = new TestElement('body', this);
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    const title = this.createElement('title');
    title.textContent = 'Lesson title';
    title.dataset.he = 'כותרת השיעור';
    title.dataset.th = 'ชื่อบทเรียน';
    this.head.appendChild(title);
    this.activeElement = this.body;
  }
  createElement(tag) { return new TestElement(tag, this); }
  querySelectorAll(selector) { return this.documentElement.querySelectorAll(selector); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  getElementById(id) { return this.querySelector('#' + id); }
  get title() { return this.querySelector('title').textContent; }
  set title(text) { this.querySelector('title').textContent = text; }
}

export function createRuntime({ values = {}, denyRead = false, denyWrite = false, denyStorageAccess = false, search = '' } = {}) {
  const disk = new Map(Object.entries(values));
  const document = new TestDocument();
  for (const [tag, id] of [['div', 'quiz-container'], ['div', 'quiz-result'], ['button', 'complete-btn']]) {
    const el = document.createElement(tag); el.id = id; document.body.appendChild(el);
  }
  for (const lang of ['en', 'he', 'th']) {
    const button = document.createElement('button'); button.className = 'lang-btn'; button.dataset.lang = lang; document.body.appendChild(button);
  }
  const sandbox = {
    document, URLSearchParams, CustomEvent: TestCustomEvent,
    location: { search }, console,
    localStorage: {
      getItem(key) { if (denyRead) throw new Error('Storage read denied'); return disk.get(key) ?? null; },
      setItem(key, value) { if (denyWrite) throw new Error('Storage write denied'); disk.set(key, value); }
    }
  };
  if (denyStorageAccess) Object.defineProperty(sandbox, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(new URL('../assets/academy.js', import.meta.url), 'utf8'), context);
  return { api: context, document, disk };
}

export const plain = value => JSON.parse(JSON.stringify(value));
export function sampleQuestions(count = 5) {
  return Array.from({ length: count }, (_, index) => ({
    question: { en: `Question ${index + 1}?`, he: `שאלה ${index + 1}?`, th: `คำถาม ${index + 1}?` },
    options: [
      { en: 'Correct answer', he: 'תשובה נכונה', th: 'คำตอบที่ถูกต้อง' },
      { en: 'Other answer', he: 'תשובה אחרת', th: 'คำตอบอื่น' }
    ],
    correct: 0
  }));
}

export function answerQuiz(document, correctCount) {
  document.querySelectorAll('.quiz-question').forEach((question, index) => {
    question.querySelectorAll('.quiz-option')[index < correctCount ? 0 : 1].click();
  });
}
