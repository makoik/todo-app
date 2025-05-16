from dotenv import load_dotenv
import subprocess
import sys
import os
import time
from typer import Typer
from rich.console import Console
from rich.table import Table
import questionary
import requests
import shlex

load_dotenv()
app = Typer()
console = Console()

if getattr(sys, 'frozen', False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR =os.path.dirname(os.path.abspath(__file__))

API_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "api"))
BACKEND_ENTRY = "index.js"
os.system(f'start cmd /k "cd {API_DIR} && node index.js"')
API_URL = os.getenv("API_URL", "http://localhost:3000/todos")

print("API_DIR:", API_DIR)
print("Running backend:", BACKEND_ENTRY)


def start_backend():
    if not os.path.isdir(API_DIR):
        raise RuntimeError(f"API_DIR does not exist: {API_DIR}")
    process = subprocess.Popen(
        ["node", BACKEND_ENTRY],
        cwd=API_DIR,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    time.sleep(1.5)  # Give the server time to boot (you can fine-tune this)
    return process

backend_process = start_backend()
try:
    @app.command()
    def list():
        """Fetch and display todos."""
        use_filters = questionary.confirm("Would you like to filter the results?").ask()

        params = {}
        if use_filters:
            completed = questionary.select("Filter by completion?", choices=["yes", "no", "skip"]).ask()
            if completed != "skip":
                params["completed"] = "true" if completed == "yes" else "false"

            date = questionary.text("Filter by creation date (YYYY-MM-DD)? Leave empty to skip.").ask()
            if date:
                params["date"] = date

            task = questionary.text("Search task text? Leave empty to skip.").ask()
            if task:
                params["task"] = task

            updated = questionary.text("Filter by updated date (YYYY-MM-DD)? Leave empty to skip.").ask()
            if updated:
                params["updated_at"] = updated

            sort_by = questionary.select("Sort by?", choices=["task", "completed", "created_at", "updated_at", "skip"]).ask()
            if sort_by != "skip":
                params["sort_by"] = sort_by
                order = questionary.select("Sort order?", choices=["ASC", "DESC"]).ask()
                params["order"] = order

        try:
            response = requests.get(API_URL, params=params)
            response.raise_for_status()
            todos = response.json()

            table = Table(title="Todos")
            table.add_column("ID", justify="right", style="cyan", no_wrap=True)
            table.add_column("Task", style="dim")
            table.add_column("Completed", style="")
            table.add_column("Created At", style="dim")
            table.add_column("Updated At", style="dim")

            for todo in todos:
                table.add_row(
                    str(todo["id"]),
                    todo["task"],
                    "[green]✅[/green]" if todo["completed"] else "[red]❌[/red]",
                    todo["created_at"],
                    todo["updated_at"]
                )

            console.print(table)

        except requests.RequestException as e:
            console.print(f"[red]Error fetching todos:[/red] {e}")

    @app.command()
    def add():
        """Add a new todo."""
        task = questionary.text("Enter the task description:").ask()
        if not task:
            console.print("[red]Task cannot be empty.[/red]")
            return

        try:
            response = requests.post(API_URL, json={"task": task})
            response.raise_for_status()
            console.print("[green]Todo added successfully.[/green]")
        except requests.RequestException as e:
            console.print(f"[red]Error adding todo:[/red] {e}")


    @app.command()
    def update():
        """Update a todo (task or completion status)."""
        todo_id = questionary.text("Enter the ID of the todo to update:").ask()
        if not todo_id.isdigit():
            console.print("[red]Invalid ID.[/red]")
            return

        fields = {}
        if questionary.confirm("Update task description?").ask():
            new_task = questionary.text("New task description:").ask()
            if new_task:
                fields["task"] = new_task

        if questionary.confirm("Update completion status?").ask():
            completed = questionary.select("Set as completed?", choices=["yes", "no"]).ask()
            fields["completed"] = True if completed == "yes" else False

        if not fields:
            console.print("[yellow]No fields provided for update.[/yellow]")
            return

        try:
            response = requests.put(f"{API_URL}/{todo_id}", json=fields)
            response.raise_for_status()
            console.print("[green]Todo updated successfully.[/green]")
        except requests.RequestException as e:
            console.print(f"[red]Error updating todo:[/red] {e}")


    @app.command()
    def delete():
        """Delete a todo."""
        todo_id = questionary.text("Enter the ID of the todo to delete:").ask()
        if not todo_id.isdigit():
            console.print("[red]Invalid ID.[/red]")
            return

        confirm = questionary.confirm(f"Are you sure you want to delete todo #{todo_id}?").ask()
        if not confirm:
            return

        try:
            response = requests.delete(f"{API_URL}/{todo_id}")
            response.raise_for_status()
            console.print("[green]Todo deleted successfully.[/green]")
        except requests.RequestException as e:
            console.print(f"[red]Error deleting todo:[/red] {e}")


    @app.command()
    def shell():
        """Start an interactive todo shell."""
        console.print("[bold green]Welcome to the Todo Shell App![/bold green]\nAvailable commands:\n"
        "-[cyan]list[/cyan]\n"
        "-[cyan]add[/cyan]\n"
        "-[cyan]update[/cyan]\n"
        "-[cyan]delete[/cyan]\n"
        "-[cyan]exit[/cyan]")

        while True:
            try:
                cmd_input = questionary.text("todo>").ask()
                if not cmd_input:
                    continue

                if cmd_input.strip().lower() in ["exit", "quit"]:
                    console.print("👋 Exiting shell.")
                    break

                args = shlex.split(cmd_input)
                app(args, standalone_mode=False)

            except Exception as e:
                console.print(f"[red]Error:[/red] {e}")

    shell()
finally:
    backend_process.terminate()
if __name__ == "__main__":
    app()
