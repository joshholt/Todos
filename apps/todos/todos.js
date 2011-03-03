// ==========================================================================
// Project:   Todos
// Copyright: ©2011 My Company, Inc.
// ==========================================================================
/*globals Todos */

//............................................................
// Define the App Namespace && App Object
//
Todos = SC.Application.create();

//............................................................
// LOCAL STORAGE
//
Todos.supportsLocalStorage = function() {
  return !!(typeof(sessionStorage) !== 'undefined' || typeof(localStorage) !== 'undefined');
};

Todos.restoreTodos = function() {
  var todos = localStorage.getItem('todos');
  return todos && todos !== "undefined" ? todos : "[]";
};

Todos.saveTodos   = function(values) {
  localStorage.setItem('todos', values);
};

Todos.clearAllData = function() {
  localStorage.clear();
};

//............................................................
// MODELS
//
Todos.Todo = SC.Object.extend({
  title: null,
  isDone: false
});

//............................................................
// CONTROLLERS
//
Todos.todoListController = SC.ArrayController.create({
  content: [],

  /**
   * Creates a new todo with the passed title, then
   * adds it to the array
   */
  addTodo: function(title) {
    this.pushObject(Todos.Todo.create({ title: title }));
    //this.saveToLocalStorage();
  },

  left: function() {
    this.saveToLocalStorage();
    return this.filterProperty('isDone', false).get('length');
  }.property('@each.isDone'),

  clearCompletedTodos: function() {
    this.filterProperty('isDone', true).forEach(this.removeObject, this);
    this.saveToLocalStorage();
  },

  allAreDone: function(key, value) {
    if (value !== undefined) {
      this.setEach('isDone', value);
      this.saveToLocalStorage();
      return value;
    } else {
      return this.get('length') && this.everyProperty('isDone', true);
    }
  }.property('@each.isDone'),

  saveToLocalStorage: function() {
    var content = this.get('content');
    if (content) {
      content = content.map(function(t) { return  {title: t.get('title'), isDone: t.get('isDone')} });
      Todos.saveTodos(JSON.stringify(content));
    }
  }

});

//............................................................
// VIEW DEFINITIONS
//
Todos.CreateTodoView = SC.TemplateView.create(SC.TextFieldSupport, {
  insertNewline: function() {
    var value = this.get('value');
    
    if (value) {
      Todos.todoListController.addTodo(value);
      this.set('value', '');
    }
  }
});

Todos.todoListView = SC.TemplateCollectionView.create({ 
  contentBinding: 'Todos.todoListController',

  itemView: SC.TemplateView.extend({
    /**
     * This render method is here to handle the case of loading data
     * out of local storage b/c we are creating new SC.Object(s)
     */
    render: function(context) {
      var ret = sc_super();
      if (Todos.supportsLocalStorage()) {
        context.setClass({'done': this.getPath('content.isDone')});
      }
      return ret;
    },
    isDoneDidChange: function() {
      this.$().toggleClass('done', this.getPath('content.isDone'));
    }.observes('.content.isDone')
  })
});

Todos.statsView = SC.TemplateView.create({
  leftBinding: 'Todos.todoListController.left',

  displayLeft: function() {
    var r = this.get('left');
    return r + (r === 1 ? " item" : " items");
  }.property('left').cacheable()
});

Todos.CheckboxView = SC.TemplateView.extend(SC.CheckboxSupport, {
  valueBinding: '.parentView.content.isDone'
});

Todos.markAllDoneView = SC.TemplateView.create(SC.CheckboxSupport, {
  valueBinding: 'Todos.todoListController.allAreDone'
});

Todos.clearCompletedView = SC.TemplateView.create({
  mouseUp: function() {
    Todos.todoListController.clearCompletedTodos();
  }
});

//............................................................
// Boot the app
//
jQuery(document).ready(function() {
  if (Todos.supportsLocalStorage()) {
    var myTodos = Todos.restoreTodos();
    myTodos = myTodos === "[]" ? [] : JSON.parse(myTodos).map(function(t) { return SC.Object.create({ title: t.title, isDone: t.isDone })});
    Todos.todoListController.set('content', myTodos);
    myTodos = undefined;
  }

  Todos.mainPane = SC.TemplatePane.append({
    layerId: 'todos',
    templateName: 'todos'
  });
});
