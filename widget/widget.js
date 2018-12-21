/**
 * Add your code to load widget
 *
 * IDF Code front-end challenge 2018.4
 * @copyright Copyright (c) 2018 Interaction Design Foundation
 *
 */

// 1. Enclosures are important as this code runs in a 3rd-party website so it's better to encapsualte our data;
//    With modern technologies and specifically bundlers and 'modules' enclosures are obselete but as this code isn't
//    being transpiled, I felt I should better keep it.
// 2. I'm passing the current window and document into my enclosure; Personaly I find it excessive but theoretically I
//    could easily test the entire widget by providing mockup window and document that are part of of the test-suite.
(function widgetEnclosure(window, document){
  // 3. different companies have different coding standards and I met places that are crazy about pure-functions (that
  //    is a function that doesn't alter anything aside its inputs and output); I don't really think it's always
  //    necessary, especially when the function is "private" (inside enclosure), but technically it's easy to expose it
  //    and then it's very testable. Also, for this challenge, I tried to make small functions that do simple things;
  //    In practice I don't necessarily find single-action function more readable or easier to maintain. I do think that
  //    we should avoid long cumbersome functions but it's enough that a function will tell a simple, single coherent
  //    story.
  function createLinkDomElement(document, href, integrity) {
    const link = document.createElement('link');

    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    link.media = 'all';
    link.crossOrigin = 'anonymous';

    if (integrity) {
      link.integrity = integrity;
    }

    return link;
  }

  function appendToHeader(document, domElement) {
    document.getElementsByTagName('head')[0].appendChild(domElement);
  }

  function loadStylesheet(document, href, integrity) {
    appendToHeader(document, createLinkDomElement(document, href, integrity));
  }

  function createIframeDomElement(document, widgetId) {
    const iframe = document.createElement('iframe');
    iframe.classList.add('idf-iframe');
    iframe.id = widgetId;
    return iframe;
  }

  // 4. I prefer to keep html and javascript seperated. In this particular case, I would have asked the backend to
  //    provide the page completely ready without me needing to merge it together, which is less performant and more
  //    error-prone.   
  function getIFrameContent(widgetId, src) {
    return `<html>
      <head>
        <script>window.widgetId='${widgetId}';</script>
        <script src="${src}"></script>
      </head>
      <body></body>
    </html>`;
  }

  function writeIFrameContent(contentDocument, content) {
    contentDocument.open();
    contentDocument.write(content);
    contentDocument.close();
  }

  // 5. In order to know where to place my iframe I need to find the current script running, which is the last script
  //    loaded. This trick works because of the way HTML parses and computes its content as it loads.
  //    We can put it to the test by trying to load multiple widgets
  function getCurrentScriptDomElement(document) {
    const scripts = document.getElementsByTagName('script');

    return scripts[scripts.length-1];
  }

  function replaceDomElements(scriptNode, iframe) {
    scriptNode.parentNode.replaceChild(iframe, scriptNode);
  }

  // 6. Just to show off, I'll have the widget script talk to script running in the 3rd-party page, informing it when
  //    more articles were loaded and when that happens the iFrame's css class will update.
  //    However, we must know which of the multiple widgets we have on the page sent the messge, so we'll compare the
  //    message.source with our widgetId. Note that I'm adding a listener per widget so this code can be improved by
  //    adding the listener only once (and then update the widget based on message.source)
  function listenToMessagesFromWidget(window, widgetId) {
    window.addEventListener('message', e => {
      const message = JSON.parse(e.data);
      if ( message.source=== widgetId && message.type === 'loadMore') {
        document.querySelector(`#${widgetId}`).classList.add('extended');
      }
    });
  }

  function loadIFrame(window, document) {
    loadStylesheet(document, 'widget/iframe.css');

    const widgetId = `widget-${(Math.random()*10000 | 0)}`; // |0 is a fancy way to `Math.floor()`
      scriptNode = getCurrentScriptDomElement(document),
    
      iframe = createIframeDomElement(document, widgetId);
    replaceDomElements(scriptNode, iframe);
    writeIFrameContent(iframe.contentDocument, getIFrameContent(widgetId, scriptNode.src));
    listenToMessagesFromWidget(window, widgetId);
  }

  function loadWidget(window, document) {
    loadStylesheet(document, 'widget/widget.css');
    loadStylesheet(
      document,
      'https://use.fontawesome.com/releases/v5.6.1/css/all.css',
      'sha384-gfdkjb5BdAXd+lj+gudLWI+BXq4IuLW5IT+brZEZsLFm++aCMlF1V92rMkPaX4PP'
    );
    loadWidgetContent(window, document);
  }

  function loadWidgetContent(window, document) {
    const url ='https://www.interaction-design.org/widgets/articles?ep=usabilitygeek';
    
    fetch(url)
      .then(res => res.text())
      .then(content => {
        document.body.innerHTML = content;
        document.querySelector('.articlesWidget__loadMore button').onclick = loadMore.bind({}, document, window);
      })
      .catch(err => {
        console.log(err);
      });
  }

  function loadMore(document, window) {
    const url = 'https://www.interaction-design.org/widgets/articles/load-more/the-power-of-white-space?ep=usabilitygeek';

    fetch(url)
      .then(res => res.text())
      .then(content => {
        document.querySelector('.articlesWidget__articles').innerHTML += content;
        window.parent.postMessage(JSON.stringify({source: window.widgetId, type: 'loadMore'}), '*');
      })
      .catch(err => {
        console.log(err);
      });
  }

  // 7. In a real-life scenario, we should split the widget-injector and the actual widget-content, reducing the
  //    of risk of wrong code running were it shouldn't, and making it bit more maintainable (as we'll be able to
  //    replace the iframe and not the content, for example). Because here the two pieces of code are together I'm
  //    distinguishing them with a global flag `widgetId` (which is also used to identify messages)
  if (!window.widgetId) {
    loadIFrame(window, document);
  } else {
    loadWidget(window, document);
  }
 })(window, document);