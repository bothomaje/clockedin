import { Component, inject } from '@angular/core';
import { ProfileState } from '../../data/state/profile-state';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule],
  selector: 'app-todo-list-widget',
  styleUrl: './todo-list-widget.scss',
  templateUrl: './todo-list-widget.html',
})
export class TodoListWidget {
  private state = inject(ProfileState);
  readonly todos = this.state.todos;

  newTodoText = '';

  async addTodo(text: string) {
    await this.state.addTodo(text);
    this.newTodoText = '';
  }

  async toggleTodo(id: string) {
    await this.state.toggleTodo(id);
  }

  async removeTodo(id: string) {
    await this.state.removeTodo(id);
  }
}
