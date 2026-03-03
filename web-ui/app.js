const tabs = document.querySelectorAll('.ribbon-tabs button');
const panels = document.querySelectorAll('.ribbon-panel');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((btn) => btn.classList.remove('active'));
    panels.forEach((panel) => panel.classList.remove('active'));
    tab.classList.add('active');
    const targetId = tab.getAttribute('data-panel');
    const target = document.getElementById(targetId);
    if (target) {
      target.classList.add('active');
    }
  });
});
