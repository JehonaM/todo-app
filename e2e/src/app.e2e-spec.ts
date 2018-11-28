'use strict'; // necessary for es6 output in node

import { browser, element, by, ElementFinder, ElementArrayFinder } from 'protractor';
import { promise } from 'selenium-webdriver';

const expectedH1 = 'To Do List';
const expectedTitle = `${expectedH1}`;
const targetTask = { id: 15, name: 'Magneta' };
const targetTaskDashboardIndex = 3;
const nameSuffix = 'X';
const newTaskName = targetTask.name + nameSuffix;

class Task {
  id: number;
  name: string;

  // Factory methods

  // Task from string formatted as '<id> <name>'.
  static fromString(s: string): Task {
    return {
      id: +s.substr(0, s.indexOf(' ')),
      name: s.substr(s.indexOf(' ') + 1),
    };
  }

  // Task from task list <li> element.
  static async fromLi(li: ElementFinder): Promise<Task> {
      let stringsFromA = await li.all(by.css('a')).getText();
      let strings = stringsFromA[0].split(' ');
      return { id: +strings[0], name: strings[1] };
  }

  // Task id and name from the given detail element.
  static async fromDetail(detail: ElementFinder): Promise<Task> {
    // Get task id from the first <div>
    let _id = await detail.all(by.css('div')).first().getText();
    // Get name from the h2
    let _name = await detail.element(by.css('h2')).getText();
    return {
        id: +_id.substr(_id.indexOf(' ') + 1),
        name: _name.substr(0, _name.lastIndexOf(' '))
    };
  }
}

describe('To do App', () => {

  beforeAll(() => browser.get(''));

  function getPageElts() {
    let navElts = element.all(by.css('app-root nav a'));

    return {
      navElts: navElts,

      appDashboardHref: navElts.get(0),
      appDashboard: element(by.css('app-root app-dashboard')),
      topTasks: element.all(by.css('app-root app-dashboard > div h4')),

      appTasksHref: navElts.get(1),
      appTasks: element(by.css('app-root app-tasks')),
      allTasks: element.all(by.css('app-root app-tasks li')),
      selectedTaskSubview: element(by.css('app-root app-tasks > div:last-child')),

      taskDetail: element(by.css('app-root app-task-detail > div')),

      searchBox: element(by.css('#search-box')),
      searchResults: element.all(by.css('.search-result li'))
    };
  }

  describe('Initial page', () => {

    it(`has title '${expectedTitle}'`, () => {
      expect(browser.getTitle()).toEqual(expectedTitle);
    });

    it(`has h1 '${expectedH1}'`, () => {
        expectHeading(1, expectedH1);
    });

    const expectedViewNames = ['Dashboard', 'Tasks'];
    it(`has views ${expectedViewNames}`, () => {
      let viewNames = getPageElts().navElts.map((el: ElementFinder) => el.getText());
      expect(viewNames).toEqual(expectedViewNames);
    });

    it('has dashboard as the active view', () => {
      let page = getPageElts();
      expect(page.appDashboard.isPresent()).toBeTruthy();
    });

  });

  describe('Dashboard tests', () => {

    beforeAll(() => browser.get(''));

    it('has top tasks', () => {
      let page = getPageElts();
      expect(page.topTasks.count()).toEqual(4);
    });

    it(`selects and routes to ${targetTask.name} details`, dashboardSelectTargetTask);

    it(`updates task name (${newTaskName}) in details view`, updateTaskNameInDetailView);

    it(`cancels and shows ${targetTask.name} in Dashboard`, () => {
      element(by.buttonText('go back')).click();
      browser.waitForAngular(); // seems necessary to gets tests to pass for toh-pt6

      let targetTaskElt = getPageElts().topTasks.get(targetTaskDashboardIndex);
      expect(targetTaskElt.getText()).toEqual(targetTask.name);
    });

    it(`selects and routes to ${targetTask.name} details`, dashboardSelectTargetTask);

    it(`updates task name (${newTaskName}) in details view`, updateTaskNameInDetailView);

    it(`saves and shows ${newTaskName} in Dashboard`, () => {
      element(by.buttonText('save')).click();
      browser.waitForAngular(); // seems necessary to gets tests to pass for toh-pt6

      let targetTaskElt = getPageElts().topTasks.get(targetTaskDashboardIndex);
      expect(targetTaskElt.getText()).toEqual(newTaskName);
    });

  });

  describe('Tasks tests', () => {

    beforeAll(() => browser.get(''));

    it('can switch to Tasks view', () => {
      getPageElts().appTasksHref.click();
      let page = getPageElts();
      expect(page.appTasks.isPresent()).toBeTruthy();
      expect(page.allTasks.count()).toEqual(10, 'number of tasks');
    });

    it('can route to task details', async () => {
      getTaskLiEltById(targetTask.id).click();

      let page = getPageElts();
      expect(page.taskDetail.isPresent()).toBeTruthy('shows task detail');
      let task = await Task.fromDetail(page.taskDetail);
      expect(task.id).toEqual(targetTask.id);
      expect(task.name).toEqual(targetTask.name.toUpperCase());
    });

    it(`updates task name (${newTaskName}) in details view`, updateTaskNameInDetailView);

    it(`shows ${newTaskName} in Tasks list`, () => {
      element(by.buttonText('save')).click();
      browser.waitForAngular();
      let expectedText = `${targetTask.id} ${newTaskName}`;
      expect(getTaskAEltById(targetTask.id).getText()).toEqual(expectedText);
    });

    it(`deletes ${newTaskName} from Tasks list`, async () => {
      const tasksBefore = await toTaskArray(getPageElts().allTasks);
      const li = getTaskLiEltById(targetTask.id);
      li.element(by.buttonText('x')).click();

      const page = getPageElts();
      expect(page.appTasks.isPresent()).toBeTruthy();
      expect(page.allTasks.count()).toEqual(9, 'number of tasks');
      const tasksAfter = await toTaskArray(page.allTasks);
      // console.log(await Task.fromLi(page.allTasks[0]));
      const expectedTasks =  tasksBefore.filter(h => h.name !== newTaskName);
      expect(tasksAfter).toEqual(expectedTasks);
      // expect(page.selectedTaskSubview.isPresent()).toBeFalsy();
    });

    it(`adds back ${targetTask.name}`, async () => {
      const newTaskName = 'Alice';
      const tasksBefore = await toTaskArray(getPageElts().allTasks);
      const numTasks = tasksBefore.length;

      element(by.css('input')).sendKeys(newTaskName);
      element(by.buttonText('add')).click();

      let page = getPageElts();
      let tasksAfter = await toTaskArray(page.allTasks);
      expect(tasksAfter.length).toEqual(numTasks + 1, 'number of tasks');

      expect(tasksAfter.slice(0, numTasks)).toEqual(tasksBefore, 'Old tasks are still there');

      const maxId = tasksBefore[tasksBefore.length - 1].id;
      expect(tasksAfter[numTasks]).toEqual({id: maxId + 1, name: newTaskName});
    });

    it('displays correctly styled buttons', async () => {
      element.all(by.buttonText('x')).then(buttons => {
        for (const button of buttons) {
          // Inherited styles from styles.css
          expect(button.getCssValue('font-family')).toBe('Arial');
          expect(button.getCssValue('border')).toContain('none');
          expect(button.getCssValue('padding')).toBe('5px 10px');
          expect(button.getCssValue('border-radius')).toBe('4px');
          // Styles defined in tasks.component.css
          expect(button.getCssValue('left')).toBe('194px');
          expect(button.getCssValue('top')).toBe('-32px');
        }
      });

      const addButton = element(by.buttonText('add'));
      // Inherited styles from styles.css
      expect(addButton.getCssValue('font-family')).toBe('Arial');
      expect(addButton.getCssValue('border')).toContain('none');
      expect(addButton.getCssValue('padding')).toBe('5px 10px');
      expect(addButton.getCssValue('border-radius')).toBe('4px');
    });

  });

  describe('Progressive task search', () => {

    beforeAll(() => browser.get(''));

    it(`searches for 'Ma'`, async () => {
      getPageElts().searchBox.sendKeys('Ma');
      browser.sleep(1000);

      expect(getPageElts().searchResults.count()).toBe(4);
    });

    it(`continues search with 'g'`, async () => {
      getPageElts().searchBox.sendKeys('g');
      browser.sleep(1000);
      expect(getPageElts().searchResults.count()).toBe(2);
    });

    it(`continues search with 'e' and gets ${targetTask.name}`, async () => {
      getPageElts().searchBox.sendKeys('n');
      browser.sleep(1000);
      let page = getPageElts();
      expect(page.searchResults.count()).toBe(1);
      let task = page.searchResults.get(0);
      expect(task.getText()).toEqual(targetTask.name);
    });

    it(`navigates to ${targetTask.name} details view`, async () => {
      let task = getPageElts().searchResults.get(0);
      expect(task.getText()).toEqual(targetTask.name);
      task.click();

      let page = getPageElts();
      expect(page.taskDetail.isPresent()).toBeTruthy('shows task detail');
      let task2 = await Task.fromDetail(page.taskDetail);
      expect(task2.id).toEqual(targetTask.id);
      expect(task2.name).toEqual(targetTask.name.toUpperCase());
    });
  });

  async function dashboardSelectTargetTask() {
    let targetTaskElt = getPageElts().topTasks.get(targetTaskDashboardIndex);
    expect(targetTaskElt.getText()).toEqual(targetTask.name);
    targetTaskElt.click();
    browser.waitForAngular(); // seems necessary to gets tests to pass for toh-pt6

    let page = getPageElts();
    expect(page.taskDetail.isPresent()).toBeTruthy('shows task detail');
    let task = await Task.fromDetail(page.taskDetail);
    expect(task.id).toEqual(targetTask.id);
    expect(task.name).toEqual(targetTask.name.toUpperCase());
  }

  async function updateTaskNameInDetailView() {
    // Assumes that the current view is the task details view.
    addToTaskName(nameSuffix);

    let page = getPageElts();
    let task = await Task.fromDetail(page.taskDetail);
    expect(task.id).toEqual(targetTask.id);
    expect(task.name).toEqual(newTaskName.toUpperCase());
  }

});

function addToTaskName(text: string): promise.Promise<void> {
  let input = element(by.css('input'));
  return input.sendKeys(text);
}

function expectHeading(hLevel: number, expectedText: string): void {
    let hTag = `h${hLevel}`;
    let hText = element(by.css(hTag)).getText();
    expect(hText).toEqual(expectedText, hTag);
};

function getTaskAEltById(id: number): ElementFinder {
  let spanForId = element(by.cssContainingText('li span.badge', id.toString()));
  return spanForId.element(by.xpath('..'));
}

function getTaskLiEltById(id: number): ElementFinder {
  let spanForId = element(by.cssContainingText('li span.badge', id.toString()));
  return spanForId.element(by.xpath('../..'));
}

async function toTaskArray(allTasks: ElementArrayFinder): Promise<Task[]> {
  let promisedTasks = await allTasks.map(Task.fromLi);
  // The cast is necessary to get around issuing with the signature of Promise.all()
  return <Promise<any>> Promise.all(promisedTasks);
}
