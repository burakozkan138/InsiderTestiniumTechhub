document.addEventListener('DOMContentLoaded', function () {
  // DOM Elements
  const taskList = document.getElementById('task-list');
  const container = document.getElementsByClassName('container')[0];

  // modal
  const taskForm = document.getElementById('task-form');
  const titleInput = document.getElementById('title');
  const descriptionInput = document.getElementById('description');
  const titleError = document.getElementById('title-error');
  const priorityError = document.getElementById('priority-error');
  const taskModal = document.getElementById('task-modal');

  // buttons
  const addTaskBtn = document.getElementById('add-task-btn');
  const closeModalBtn = document.getElementById('close-modal');
  const cancelTaskBtn = document.getElementById('cancel-task');
  const emptyState = document.getElementById('empty');
  const tasksCounter = document.getElementById('tasks-counter');

  // Event Listeners
  taskForm.addEventListener('submit', addTask);
  taskList.addEventListener('click', handleTaskActions);
  addTaskBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  cancelTaskBtn.addEventListener('click', closeModal);

  // Tasks array to store all tasks
  let tasks = [];

  // Initialize the app
  function init() {
    // clear the task list
    taskList.innerHTML = '';
    updateEmptyState();
    updateTasksCounter();
  }

  // Open the task modal
  function openModal() {
    taskModal.classList.add('show');
    container.style.filter = 'blur(5px)';
    titleInput.focus();
  }

  // Close the task modal
  function closeModal() {
    taskModal.classList.remove('show');
    container.style.removeProperty('filter');
    taskForm.reset();
    titleError.textContent = '';
    priorityError.textContent = '';
  }

  // Update empty state visibility
  function updateEmptyState() {
    if (tasks.length === 0) {
      emptyState.style.display = 'flex';
      taskList.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      taskList.style.display = 'block';
    }
  }

  // Update tasks counter
  function updateTasksCounter() {
    tasksCounter.textContent = tasks.length;
  }

  // Add a new task
  function addTask(event) {
    event.preventDefault();

    try {
      // Reset error messages
      titleError.textContent = '';
      priorityError.textContent = '';

      // Validate form
      const title = titleInput.value.trim();
      const description = descriptionInput.value.trim() || null;
      const priorityElements = document.querySelectorAll('input[name="priority"]');
      let priority = null;

      // Check if title is empty
      if (!title) {
        titleError.textContent = 'Başlık alanı zorunludur!';
        return;
      }

      // Check if priority is selected
      for (const radio of priorityElements) {
        if (radio.checked) {
          priority = radio.value;
          break;
        }
      }

      if (!priority) {
        priorityError.textContent = 'Lütfen bir öncelik seçin!';
        return;
      }

      // Create new task object
      const newTask = {
        id: Date.now(),
        title,
        description,
        priority,
        completed: false
      };

      // Add task to array
      tasks.push(newTask);

      // Render the task
      renderTask(newTask);

      // Update UI
      updateEmptyState();
      updateTasksCounter();

      // Close modal and reset form
      closeModal();

    } catch (error) {
      console.error('Görev eklenirken bir hata oluştu:', error);
      alert('Görev eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  }

  // Render a single task
  function renderTask(task) {
    const taskItem = document.createElement('li');
    taskItem.className = `task-item ${task.completed ? 'completed' : ''} ${task.priority}`;
    taskItem.dataset.id = task.id;

    const priorityLabel = {
      'low': 'Düşük',
      'medium': 'Orta',
      'high': 'Yüksek'
    };

    taskItem.innerHTML = `
        <div>
            <div class="task-content">
                <h3 class="task-title">${task.title}</h3>
                <span class="priority-badge ${task.priority}">${priorityLabel[task.priority]}</span>
            </div>
            ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
        </div>
        <div class="task-actions">
            <button class="btn-complete">
                 <i class="${task.completed ? 'fa-solid fa-rotate-left' : 'fas fa-check-circle'}"></i>
                ${task.completed ? 'İptal Et' : 'Tamamla'}
            </button>
            <button class="btn-delete">
                <i class="fas fa-trash"></i> Sil
            </button>
        </div>
    `;

    taskList.appendChild(taskItem);
  }

  // Handle task actions (complete/delete)
  function handleTaskActions(event) {
    // Prevent event bubbling
    event.stopPropagation();

    const target = event.target;
    const actionButton = target.closest('button');

    if (!actionButton) return;

    const taskItem = actionButton.closest('.task-item');
    const taskId = parseInt(taskItem.dataset.id);

    if (actionButton.classList.contains('btn-complete')) {
      // Find the task in the array
      const taskIndex = tasks.findIndex(task => task.id === taskId);

      if (taskIndex !== -1) {
        // Toggle completed status
        tasks[taskIndex].completed = !tasks[taskIndex].completed;

        // Update UI
        taskItem.classList.toggle('completed');

        actionButton.innerHTML = `
        <i class="${tasks[taskIndex].completed ? 'fa-solid fa-rotate-left' : 'fas fa-check-circle'}"></i>
        ${tasks[taskIndex].completed ? 'İptal Et' : 'Tamamla'}`;
      }
    } else if (actionButton.classList.contains('btn-delete')) {
      tasks = tasks.filter(task => task.id !== taskId);

      // Remove from DOM with animation
      taskItem.style.opacity = '0';
      taskItem.style.transform = 'translateX(30px)';
      taskItem.style.transition = 'opacity 0.3s, transform 0.3s';

      setTimeout(() => {
        taskItem.remove();
        updateEmptyState();
        updateTasksCounter();
      }, 300);
    }
  }

  // Initialize the app
  init();
});
