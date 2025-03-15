const appendLocation = '.homework';

(function () {
  const script = document.createElement('script');
  script.src = 'https://code.jquery.com/jquery-3.7.1.min.js';
  script.integrity = 'sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=';
  script.crossOrigin = 'anonymous';
  script.onload = init;

  document.head.appendChild(script);
})();

function init() {
  $(document).ready(function () {
    $('body').css({
      'font-family': 'Arial, sans-serif',
      'line-height': '1.6',
      'margin': '0',
      'padding': '20px',
      'background-color': '#f8f9fa'
    });

    const container = $('<div></div>').css({
      'max-width': '900px',
      'margin': '0 auto',
      'background': 'white',
      'padding': '25px',
      'border-radius': '10px',
      'box-shadow': '0 3px 15px rgba(0,0,0,0.08)'
    });

    const title = $('<h1>User Management</h1>').css({
      'text-align': 'center',
      'margin-bottom': '30px',
      'color': '#343a40',
      'font-weight': '600'
    });

    const deleteAllBtn = $('<button></button>')
      .text('Delete All Users')
      .css({
        'background-color': '#dc3545',
        'color': 'white',
        'border': 'none',
        'padding': '10px 20px',
        'border-radius': '5px',
        'cursor': 'pointer',
        'font-size': '16px',
        'font-weight': '500',
        'margin-bottom': '20px',
        'display': 'block',
        'margin-left': 'auto',
        'margin-right': 'auto',
        'transition': 'all 0.2s ease',
      })
      .hover(
        function () {
          $(this).css({
            'background-color': '#c82333',
            'box-shadow': '0 2px 5px rgba(220,53,69,0.3)'
          });
        },
        function () {
          $(this).css({
            'background-color': '#dc3545',
            'box-shadow': 'none'
          });
        }
      )
      .on('click', deleteAllUsers);

    const usersList = $('<div></div>').attr('id', 'usersList');

    container.append(title).append(deleteAllBtn).append(usersList);
    $(appendLocation).append(container);

    setupMutationObserver();

    loadUsers();
  });
}

function setupMutationObserver() {
  const targetNode = document.querySelector(appendLocation);

  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === 'childList') {
        showFetchAgainButton();
      }
    });
  });

  const config = {
    childList: true,
    subtree: true
  };

  observer.observe(targetNode, config);
}

function showFetchAgainButton() {
  if ((sessionStorage.getItem('fetchButtonUsed') === 'true') || $('#fetchAgainBtn').length) {
    return;
  }

  const fetchAgainBtn = $('<button></button>')
    .attr('id', 'fetchAgainBtn')
    .text('Fetch Users Again')
    .css({
      'background-color': '#007bff',
      'color': 'white',
      'border': 'none',
      'padding': '12px 25px',
      'border-radius': '5px',
      'cursor': 'pointer',
      'font-size': '16px',
      'font-weight': '500',
      'margin-top': '20px',
      'margin-bottom': '20px',
      'display': 'block',
      'width': '200px',
      'margin-left': 'auto',
      'margin-right': 'auto',
      'transition': 'all 0.2s ease'
    })
    .hover(
      function () {
        $(this).css({
          'background-color': '#0069d9',
          'box-shadow': '0 2px 5px rgba(0,123,255,0.3)'
        });
      },
      function () {
        $(this).css({
          'background-color': '#007bff',
          'box-shadow': 'none'
        });
      }
    )
    .on('click', function () {
      sessionStorage.setItem('fetchButtonUsed', 'true');

      $(this).fadeOut(300, function () {
        $(this).remove();
      });

      localStorage.removeItem('users');
      loadUsers();
    });

  $('#usersList').after(fetchAgainBtn);
}

function createUserCard(user) {
  const card = $('<div></div>').addClass('user-card').attr('data-id', user.id).css({
    'background': 'white',
    'border': '1px solid #e9ecef',
    'border-radius': '8px',
    'padding': '18px',
    'margin-bottom': '15px',
    'box-shadow': '0 2px 5px rgba(0,0,0,0.05)',
    'transition': 'all 0.2s ease-in-out'
  });

  card.hover(
    function () {
      $(this).css({
        'transform': 'translateY(-3px)',
        'box-shadow': '0 5px 15px rgba(0,0,0,0.1)'
      });
    },
    function () {
      $(this).css({
        'transform': 'translateY(0)',
        'box-shadow': '0 2px 5px rgba(0,0,0,0.05)'
      });
    }
  );

  const name = $('<h3></h3>').text(user.name).css({
    'margin': '0 0 8px 0',
    'font-size': '19px',
    'color': '#212529',
    'font-weight': '600'
  });

  const email = $('<div></div>').css({
    'margin': '0 0 12px 0',
    'color': '#6c757d',
    'font-size': '14px',
    'display': 'flex',
    'align-items': 'center'
  });

  const emailIcon = $('<span>✉️</span>').css('margin-right', '5px');
  email.append(emailIcon).append(user.email);

  const address = $('<div></div>').css({
    'margin': '12px 0',
    'font-size': '14px',
    'color': '#495057',
    'line-height': '1.5'
  });

  const addressIcon = $('<span>📍</span>').css('margin-right', '5px');
  const addressBold = $('<strong></strong>').text('Address: ').css('margin-right', '5px');
  const addressText = `${user.address.street}, ${user.address.suite}, ${user.address.city}, ${user.address.zipcode}`;
  address.append(addressIcon).append(addressBold).append(addressText);

  const divider = $('<hr>').css({
    'margin': '15px 0',
    'border': 'none',
    'height': '1px',
    'background-color': '#e9ecef'
  });

  const buttonContainer = $('<div></div>').css({
    'margin-top': '12px',
    'display': 'flex',
    'justify-content': 'flex-end'
  });

  const deleteBtn = $('<button></button>')
    .text('Delete')
    .attr('data-id', user.id)
    .css({
      'background-color': '#dc3545',
      'color': 'white',
      'border': 'none',
      'padding': '8px 15px',
      'border-radius': '5px',
      'cursor': 'pointer',
      'font-size': '14px',
      'font-weight': '500',
      'transition': 'all 0.2s ease'
    })
    .hover(
      function () {
        $(this).css({
          'background-color': '#c82333',
          'box-shadow': '0 2px 5px rgba(220,53,69,0.3)'
        });
      },
      function () {
        $(this).css({
          'background-color': '#dc3545',
          'box-shadow': 'none'
        });
      }
    )
    .on('click', function () {
      const userId = $(this).attr('data-id');
      deleteUser(userId);
    });

  buttonContainer.append(deleteBtn);
  card.append(name).append(email).append(address).append(divider).append(buttonContainer);

  return card;
}

function displayUsers(users) {
  const usersList = $('#usersList');
  usersList.empty();

  if (!users.length) {
    const noUsers = $('<div></div>').css({
      'text-align': 'center',
      'padding': '25px',
      'color': '#6c757d',
      'background-color': '#f8f9fa',
      'border-radius': '8px',
      'border': '1px dashed #ced4da',
      'font-size': '16px'
    });

    const emptyIcon = $('<div>👤</div>').css({
      'font-size': '40px',
      'margin-bottom': '15px'
    });

    const emptyText = $('<div>No users found</div>');
    noUsers.append(emptyIcon).append(emptyText);
    usersList.append(noUsers);

    showFetchAgainButton();
    return;
  }

  users.forEach(user => {
    const userCard = createUserCard(user);
    usersList.append(userCard);
  });
}

function showLoading() {
  const loading = $('<div></div>').css({
    'text-align': 'center',
    'padding': '30px',
    'color': '#6c757d'
  });

  const spinner = $('<div>⏳</div>').css({
    'font-size': '30px',
    'margin-bottom': '15px',
    'animation': 'spin 2s infinite linear'
  });

  const keyframes = $('<style>')
    .text('@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }');
  $('head').append(keyframes);

  const loadingText = $('<div>Loading users...</div>').css({
    'font-style': 'italic',
    'font-size': '16px'
  });

  loading.append(spinner).append(loadingText);
  $('#usersList').empty().append(loading);
}

function showError(errorMessage) {
  const error = $('<div></div>').css({
    'color': '#721c24',
    'text-align': 'center',
    'padding': '25px',
    'border': '1px solid #f5c6cb',
    'border-radius': '8px',
    'background-color': '#f8d7da',
    'margin': '20px 0'
  });

  const errorIcon = $('<div>⚠️</div>').css({
    'font-size': '30px',
    'margin-bottom': '15px'
  });

  const errorTitle = $('<p></p>').text('Failed to load users. Please try again later.').css({
    'font-weight': 'bold',
    'margin-bottom': '10px',
    'font-size': '16px'
  });

  const errorDetail = $('<p></p>').text(`Error: ${errorMessage}`).css({
    'font-size': '14px',
    'margin': '0'
  });

  error.append(errorIcon).append(errorTitle).append(errorDetail);
  $('#usersList').empty().append(error);

  showFetchAgainButton();
}

function fetchUsers() {
  showLoading();

  return $.ajax({
    url: 'https://jsonplaceholder.typicode.com/users',
    method: 'GET',
    dataType: 'json',
    success: function (users) {
      setWithExpiry('users', JSON.stringify(users));
      return users;
    },
    error: function (xhr, status, error) {
      throw new Error(`Request failed: ${error}`);
    }
  });
}

function loadUsers() {
  const storedData = getWithExpiry('users');

  if (storedData) {
    const users = JSON.parse(storedData);
    displayUsers(users);
  } else {
    fetchUsers()
      .done(function (users) {
        displayUsers(users);
      })
      .fail(function (xhr, status, error) {
        showError(error);
        console.error('Error loading users:', error);
      });
  }
}

function deleteUser(userId) {
  const users = JSON.parse(getWithExpiry('users') || '[]');
  const updatedUsers = users.filter(user => user.id !== parseInt(userId));
  setWithExpiry('users', JSON.stringify(updatedUsers));
  const userCard = $(`[data-id="${userId}"]`);

  userCard.css({
    'background-color': '#ffebee',
    'transform': 'translateX(0)'
  }).animate({
    'opacity': 0,
    'transform': 'translateX(20px)'
  }, 300, function () {
    $(this).slideUp(200, function () {
      $(this).remove();
      if (!$('#usersList .user-card').length) {
        displayUsers([]);
      }
    });
  });
}

function deleteAllUsers() {
  const users = JSON.parse(getWithExpiry('users') || '[]');
  if (!users.length) return;

  setWithExpiry('users', JSON.stringify([]));

  $('.user-card').css({
    'background-color': '#ffebee'
  }).animate({
    'opacity': 0,
    'transform': 'translateY(20px)'
  }, 400, function () {
    $('#usersList').empty();
    displayUsers([]);
  });
}

// Using sessionStorage for managing the expirable data rather than directly in localStorage
function setWithExpiry(key, value, ttl = 24 * 60 * 60 * 1000) {
  const now = new Date();

  const item = {
    value: value,
    expiry: now.getTime() + ttl,
  };
  localStorage.setItem(key, JSON.stringify(item));
}

function getWithExpiry(key) {
  const itemStr = localStorage.getItem(key);

  if (!itemStr) {
    return null;
  }

  const item = JSON.parse(itemStr);
  const now = new Date();

  if (now.getTime() > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }
  return item.value;
}