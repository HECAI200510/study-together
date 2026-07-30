(function () {
  "use strict";

  const data = window.StudyTogetherData;
  const today = new Date();
  const dateKey = formatDateKey(today);
  const storageKey = `study-together:${dateKey}`;
  const historyKey = "study-together:history";
  const themeKey = "study-together:theme";

  const elements = {
    fullDate: document.querySelector("#fullDate"),
    taskList: document.querySelector("#taskList"),
    taskCount: document.querySelector("#taskCount"),
    taskProgress: document.querySelector("#taskProgress"),
    streakMetric: document.querySelector("#streakMetric"),
    completionMetric: document.querySelector("#completionMetric"),
    completionHint: document.querySelector("#completionHint"),
    timeMetric: document.querySelector("#timeMetric"),
    commitMetric: document.querySelector("#commitMetric"),
    githubTotal: document.querySelector("#githubTotal"),
    activeDays: document.querySelector("#activeDays"),
    totalTasks: document.querySelector("#totalTasks"),
    learnedInput: document.querySelector("#learnedInput"),
    problemsInput: document.querySelector("#problemsInput"),
    tomorrowInput: document.querySelector("#tomorrowInput"),
    saveState: document.querySelector("#saveState"),
    heatmap: document.querySelector("#heatmap"),
    commitList: document.querySelector("#commitList"),
    focusList: document.querySelector("#focusList"),
    taskDialog: document.querySelector("#taskDialog"),
    taskForm: document.querySelector("#taskForm"),
    taskTitleInput: document.querySelector("#taskTitleInput"),
    taskCategoryInput: document.querySelector("#taskCategoryInput"),
    taskMinutesInput: document.querySelector("#taskMinutesInput"),
    toast: document.querySelector("#toast")
  };

  let state = loadState();
  let saveTimer;
  let toastTimer;

  function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function cloneDefaultTasks() {
    return data.defaultTasks.map((task) => ({ ...task }));
  }

  function loadState() {
    const fallback = {
      tasks: cloneDefaultTasks(),
      learned: "",
      problems: "",
      tomorrow: ""
    };

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (!saved || !Array.isArray(saved.tasks)) {
        return fallback;
      }
      return { ...fallback, ...saved };
    } catch (error) {
      console.warn("无法读取本地学习记录，已使用默认数据。", error);
      return fallback;
    }
  }

  function saveState(showFeedback = false) {
    localStorage.setItem(storageKey, JSON.stringify(state));
    updateHistory();

    if (showFeedback) {
      elements.saveState.textContent = "已保存";
      elements.saveState.classList.add("saved");
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        elements.saveState.textContent = "自动保存";
        elements.saveState.classList.remove("saved");
      }, 1400);
    }
  }

  function updateHistory() {
    const history = getHistory();
    const completed = state.tasks.length > 0 && state.tasks.every((task) => task.done);
    history[dateKey] = completed;
    localStorage.setItem(historyKey, JSON.stringify(history));
  }

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(historyKey)) || {};
    } catch {
      return {};
    }
  }

  function getCurrentStreak() {
    const history = getHistory();
    if (!history[dateKey]) {
      return data.stats.streak;
    }
    return data.stats.streak + 1;
  }

  function renderDate() {
    elements.fullDate.textContent = new Intl.DateTimeFormat("zh-CN", {
      month: "long",
      day: "numeric",
      weekday: "long"
    }).format(today);
  }

  function renderTasks() {
    elements.taskList.replaceChildren();

    state.tasks.forEach((task) => {
      const item = document.createElement("article");
      item.className = `task-item${task.done ? " done" : ""}`;
      item.dataset.id = task.id;

      const checkButton = document.createElement("button");
      checkButton.className = "task-check";
      checkButton.type = "button";
      checkButton.setAttribute("aria-label", task.done ? `取消完成 ${task.title}` : `完成 ${task.title}`);
      checkButton.innerHTML =
        '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 12 4 4 8-9"></path></svg>';
      checkButton.addEventListener("click", () => toggleTask(task.id));

      const body = document.createElement("div");
      body.className = "task-body";
      const title = document.createElement("strong");
      title.textContent = task.title;
      const category = document.createElement("span");
      category.textContent = task.category;
      body.append(title, category);

      const time = document.createElement("span");
      time.className = "task-time";
      time.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"></circle><path d="M12 8v4l2.5 1.5"></path></svg>${task.minutes} min`;

      const deleteButton = document.createElement("button");
      deleteButton.className = "task-delete";
      deleteButton.type = "button";
      deleteButton.setAttribute("aria-label", `删除 ${task.title}`);
      deleteButton.innerHTML =
        '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 7h14M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5"></path></svg>';
      deleteButton.addEventListener("click", () => deleteTask(task.id));

      item.append(checkButton, body, time, deleteButton);
      elements.taskList.append(item);
    });

    renderMetrics();
  }

  function renderMetrics() {
    const completedTasks = state.tasks.filter((task) => task.done);
    const completedCount = completedTasks.length;
    const taskTotal = state.tasks.length;
    const completion = taskTotal ? Math.round((completedCount / taskTotal) * 100) : 0;
    const completedMinutes = completedTasks.reduce((sum, task) => sum + Number(task.minutes || 0), 0);

    elements.taskCount.textContent = `${completedCount} / ${taskTotal} 完成`;
    elements.completionHint.textContent = `已完成 ${completedCount} / ${taskTotal} 项任务`;
    elements.completionMetric.textContent = completion;
    elements.taskProgress.style.width = `${completion}%`;
    elements.timeMetric.textContent = formatHours(completedMinutes / 60);
    elements.streakMetric.textContent = getCurrentStreak();
    elements.totalTasks.innerHTML = `${data.stats.completedTasks + completedCount} <small>项</small>`;
  }

  function formatHours(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  function toggleTask(id) {
    const task = state.tasks.find((item) => item.id === id);
    if (!task) return;

    task.done = !task.done;
    saveState();
    renderTasks();
    showToast(task.done ? "任务完成，继续保持。" : "已恢复为待完成任务。");
  }

  function deleteTask(id) {
    state.tasks = state.tasks.filter((task) => task.id !== id);
    saveState();
    renderTasks();
    showToast("任务已删除。");
  }

  function addTask(event) {
    event.preventDefault();
    const title = elements.taskTitleInput.value.trim();
    if (!title) return;

    state.tasks.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      category: elements.taskCategoryInput.value,
      minutes: Number(elements.taskMinutesInput.value) || 30,
      done: false
    });

    saveState();
    renderTasks();
    elements.taskDialog.close();
    elements.taskForm.reset();
    elements.taskMinutesInput.value = "45";
    showToast("新任务已添加。");
  }

  function openTaskDialog() {
    elements.taskDialog.showModal();
    window.setTimeout(() => elements.taskTitleInput.focus(), 0);
  }

  function closeTaskDialog() {
    elements.taskDialog.close();
  }

  function bindLogInputs() {
    const fields = [
      ["learned", elements.learnedInput],
      ["problems", elements.problemsInput],
      ["tomorrow", elements.tomorrowInput]
    ];

    fields.forEach(([key, input]) => {
      input.value = state[key] || "";
      input.addEventListener("input", () => {
        state[key] = input.value;
        saveState(true);
      });
    });
  }

  function renderGithub() {
    elements.commitMetric.textContent = data.github.monthCommits;
    elements.githubTotal.textContent = data.github.monthCommits;
    elements.activeDays.textContent = data.github.activeDays;

    elements.commitList.replaceChildren();
    data.commits.forEach((commit) => {
      const item = document.createElement("li");
      item.className = "commit-row";

      const dot = document.createElement("i");
      dot.className = "commit-dot";

      const content = document.createElement("div");
      const message = document.createElement("strong");
      message.textContent = commit.message;
      const hash = document.createElement("span");
      hash.textContent = commit.hash;
      content.append(message, hash);

      const time = document.createElement("span");
      time.textContent = commit.time;
      item.append(dot, content, time);
      elements.commitList.append(item);
    });
  }

  function renderHeatmap() {
    const activityPattern = [0, 1, 0, 2, 1, 0, 0, 1, 2, 3, 0, 1, 0, 0, 2, 4, 2, 1, 0, 0, 1];
    elements.heatmap.replaceChildren();

    for (let index = 0; index < 112; index += 1) {
      const cell = document.createElement("span");
      const level = activityPattern[(index * 7 + Math.floor(index / 11)) % activityPattern.length];
      cell.className = `heatmap-cell level-${level}`;
      cell.title = level ? `${level} 次学习记录` : "暂无学习记录";
      elements.heatmap.append(cell);
    }
  }

  function renderFocus() {
    elements.focusList.replaceChildren();
    data.weeklyFocus.forEach((focus) => {
      const item = document.createElement("div");
      item.className = "focus-item";
      item.style.setProperty("--bar-color", focus.color);
      item.style.setProperty("--bar-width", `${focus.percent}%`);
      item.innerHTML = `
        <div class="focus-item-heading">
          <span><i></i>${escapeHtml(focus.label)}</span>
          <span>${focus.hours}h</span>
        </div>
        <div class="focus-bar"><span></span></div>
      `;
      elements.focusList.append(item);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        })[character]
    );
  }

  function exportMarkdown() {
    const taskLines = state.tasks.length
      ? state.tasks
          .map(
            (task) =>
              `- [${task.done ? "x" : " "}] ${task.title}（${task.category}，${task.minutes} 分钟）`
          )
          .join("\n")
      : "- 暂无任务";

    const markdown = `# ${dateKey}

## 今日目标

${taskLines}

## 完成情况

已完成 ${state.tasks.filter((task) => task.done).length} / ${state.tasks.length} 项任务。

## 学习内容

${state.learned.trim() || "待补充"}

## 遇到问题

${state.problems.trim() || "待补充"}

## 明日计划

${state.tomorrow.trim() || "待补充"}
`;

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${dateKey}.md`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`已导出 ${dateKey}.md`);
  }

  function setTheme(theme) {
    document.body.classList.toggle("light-theme", theme === "light");
    localStorage.setItem(themeKey, theme);
  }

  function toggleTheme() {
    const isLight = document.body.classList.contains("light-theme");
    setTheme(isLight ? "dark" : "light");
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 2200);
  }

  function bindEvents() {
    document.querySelector("#openTaskDialog").addEventListener("click", openTaskDialog);
    document.querySelector("#openTaskDialogSecondary").addEventListener("click", openTaskDialog);
    document.querySelector("#closeTaskDialog").addEventListener("click", closeTaskDialog);
    document.querySelector("#cancelTaskDialog").addEventListener("click", closeTaskDialog);
    document.querySelector("#exportButton").addEventListener("click", exportMarkdown);
    document.querySelector("#themeButton").addEventListener("click", toggleTheme);
    elements.taskForm.addEventListener("submit", addTask);
    elements.taskDialog.addEventListener("click", (event) => {
      if (event.target === elements.taskDialog) closeTaskDialog();
    });
  }

  function init() {
    setTheme(localStorage.getItem(themeKey) || "dark");
    renderDate();
    renderTasks();
    bindLogInputs();
    renderGithub();
    renderHeatmap();
    renderFocus();
    bindEvents();
  }

  init();
})();
