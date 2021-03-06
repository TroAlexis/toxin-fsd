const DOM = {
  select: '.input-calendar__select',
  arrival: {
    select: '.input-calendar__select.arrival',
    input: '.input-calendar__arrival',
  },
  depart: {
    select: '.input-calendar__select.depart',
    input: '.input-calendar__depart',
  },
  content: '.input-calendar__content',
  arrows: {
    back: '.input-calendar__arrow',
    forward: '.input-calendar__arrow--forward',
  },
  month: '.input-calendar__month',
  year: '.input-calendar__year',
  weekdays: '.input-calendar__weekdays',
  weekday: '.input-calendar__weekday',
  days: '.input-calendar__days',
  day: '.input-calendar__day',
  apply: '.input-calendar__apply',
  clear: '.input-calendar__clear',

};

export default class Calendar {
  constructor(calendarElement, options = {
    listeners: {
      selects: true,
      buttons: true,
    },
  }) {
    this.element = calendarElement;
    this.state = 'closed';
    this.elements = {
      arrival: {
        select: calendarElement.querySelector(DOM.arrival.select),
        input: calendarElement.querySelector(DOM.arrival.input),
        defaultText: calendarElement.querySelector(DOM.arrival.input)
          ? calendarElement.querySelector(DOM.arrival.input).textContent : undefined,
      },
      depart: {
        select: calendarElement.querySelector(DOM.depart.select),
        input: calendarElement.querySelector(DOM.depart.input),
        defaultText: calendarElement.querySelector(DOM.depart.input)
          ? calendarElement.querySelector(DOM.depart.input).textContent : undefined,
      },
      content: calendarElement.querySelector(DOM.content),
      month: calendarElement.querySelector(DOM.month),
      days: calendarElement.querySelector(DOM.days),
      buttons: {
        apply: calendarElement.querySelector(DOM.apply),
        clear: calendarElement.querySelector(DOM.clear),
        back: calendarElement.querySelector(DOM.arrows.back),
        forward: calendarElement.querySelector(DOM.arrows.forward),
      },
    };
    this.data = {
      dates: {
        initial: new Date(),
        current: new Date(),
        arrival: '',
        depart: '',
      },
      monthList: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    };
    this.renderAllDays();
    if (options.listeners.selects) {
      // LISTENER FOR SELECTS
      this.element.addEventListener('click', (evt) => {
        // SELECT CLICKED
        if (evt.target.closest(DOM.select)) {
          // SELECT ELEMENT
          const select = evt.target.closest(DOM.select);
          // GET CONTENT ELEMENT
          const { content } = this.elements;
          // IF CALENDAR IS NOT OPEN
          if (!content.classList.contains('open')) {
            content.classList.add('open');
            // CHANGE STATE TO SELECT CLICKED (ARRIVAL OR DEPART)
            [this.state] = select.className.match(/depart|arrival/);
            select.classList.add('active');
            // IF CALENDAR IS OPEN
          } else {
            this.changeState(select.className.match(/depart|arrival/)[0]);
          }
        }
      });
    }
    if (options.listeners.buttons) { // LISTENER FOR BUTTONS
      this.elements.content.addEventListener('click', (evt) => {
        if (evt.target.classList.contains(noDot(DOM.arrows.back))) {
          this.clearDays();
          if (evt.target.classList.contains(noDot(DOM.arrows.forward))) {
            this.data.dates.current.setMonth(this.data.dates.current.getMonth() + 1);
          } else {
            this.data.dates.current.setMonth(this.data.dates.current.getMonth() - 1);
          }
          this.renderAllDays();
        }
        if (evt.target.classList.contains(noDot(DOM.day))
            && !evt.target.classList.contains('disabled')) {
          const clickedDay = parseInt(evt.target.getAttribute('data-day'), 10);
          const clickedDate = new Date(this.data.dates.current.getFullYear(),
            this.data.dates.current.getMonth(),
            clickedDay);
          if (this.data.dates.arrival && this.data.dates.depart) {
            this.clearData();
            this.clearDaysBetween();
            this.changeDay(0, 'depart');
            this.changeDay(0, 'arrival');
            if (this.changeDate(clickedDate, this.state)) {
              this.changeDay(evt.target);
              this.changeFocus(this.state);
            }
          } else if (this.changeDate(clickedDate, this.state)) {
            if (this.data.dates.arrival && this.data.dates.depart) {
              this.data.daysBetween = daysInMilliSeconds(this.data.dates.depart
                  - this.data.dates.arrival);
            }
            this.changeDay(evt.target);
            this.clearDaysBetween();
            this.setDaysBetween();
            this.changeFocus(this.state);
          }
        }
        if (evt.target.classList.contains(noDot(DOM.clear))) {
          evt.preventDefault();
          this.clearAll();
        }
        if (evt.target.classList.contains(noDot(DOM.apply))) {
          evt.preventDefault();
          if (this.data.dates.arrival && this.data.dates.depart) {
            const { arrival } = this.data.dates;
            const { depart } = this.data.dates;
            let arrivalText; let
              departText;
            // If there are depart and arrival input elements in the Calendar
            if (this.elements.depart.input) {
              arrivalText = `${arrival.getDate().toString().padStart(2, '0')}.${arrival.getMonth().toString().padStart(2, '0')}.${arrival.getFullYear()}`;
              departText = `${depart.getDate().toString().padStart(2, '0')}.${depart.getMonth().toString().padStart(2, '0')}.${depart.getFullYear()}`;
              this.elements.depart.input.textContent = departText;
              this.element.setAttribute('data-depart', this.elements.depart.input.textContent);
              this.elements.arrival.input.textContent = arrivalText;
              this.element.setAttribute('data-arrival', this.elements.arrival.input.textContent);
            } else {
              arrivalText = `${arrival.getDate().toString().padStart(2, '0')} ${this.data.monthList[arrival.getMonth()].substring(0, 3).toLowerCase()}`;
              departText = `${depart.getDate().toString().padStart(2, '0')} ${this.data.monthList[depart.getMonth()].substring(0, 3).toLowerCase()}`;
              this.elements.arrival.input.textContent = `${arrivalText} - ${departText}`;
            }
            this.changeState(this.state);
          }
        }
      });
    }
  }

  static dateIsBetween(from, to, date) {
    return date < to && date > from;
  }

  // GET DAYS IN MONTH (JANUARY 1 BASED)
  static daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  // CALC FIRST DAY OF MONTH
  static calcFirstDayOfMonth(date) {
    const dateCopy = date;
    dateCopy.setDate(1);
    return dateCopy.getDay();
  }

  // CREATE A DAY ELEMENT
  static createDayElement(day, types = '', addDayData = false) {
    const dayElement = document.createElement('span');
    dayElement.className = noDot(DOM.day);
    if (types) {
      dayElement.classList.add(...types);
    }
    if (addDayData) {
      dayElement.setAttribute('data-day', `${day}`);
    }
    dayElement.textContent = `${day}`;
    return dayElement;
  }

  static get domstrings() {
    return DOM;
  }

  changeState(state) {
    if (this.state === state) {
      this.elements.content.classList.remove('open');
      if (this.elements[state].select) {
        this.elements[state].select.classList.remove('active');
      }
    } else {
      if (this.elements[this.state].select) {
        this.elements[this.state].select.classList.remove('active');
      }
      this.state = state;
      if (this.elements[state].select) {
        this.elements[state].select.classList.add('active');
      }
    }
  }

  changeDate(forDate, type) {
    const initialDate = new Date(
      this.data.dates.initial.getFullYear(),
      this.data.dates.initial.getMonth(),
      this.data.dates.initial.getDate(),
    );
    // IF INPUT DATE IS NOT AFTER INITIAL DATE
    if (forDate >= initialDate) {
      //  IF INPUT TYPE IS ARRIVAL
      if (type === 'arrival') {
        //  IF THERE IS A DEPART
        if (this.data.dates.depart) {
          // IF INPUT DATE IS NOT AFTER DEPART
          if (forDate <= this.data.dates.depart) {
            this.data.dates.arrival = forDate;
            return true;
          }
        }
      } else if (type === 'depart') {
        if (this.data.dates.arrival) {
          if (forDate >= this.data.dates.arrival) {
            this.data.dates.depart = forDate;
            return true;
          }
        }
      }
      if (!this.data.dates.arrival && !this.data.dates.depart) {
        this.data.dates[type] = forDate;
        return true;
      }
    }
    return false;
  }

  changeDay(dayElement, state = this.state) {
    // DETECT ANY OTHER ELEMENT WITH SAME TYPE AND REMOVE CLASS
    const prevButton = this.elements.content.querySelector(`.${state}`);
    if (prevButton) {
      prevButton.classList.remove(state);
    }
    if (dayElement) {
      dayElement.classList.add(state);
    }
  }

  // RENDER MONTH AND YEAR
  renderMonthYear() {
    this.elements.month.textContent = `${this.data.monthList[this.data.dates.current.getMonth()]} ${this.data.dates.current.getFullYear()}`;
  }

  // RENDER DAYS
  renderAllDays() {
    this.renderMonthYear();
    this.renderDaysBefore();
    this.renderCurrentDays();
    this.renderDaysAfter();
  }

  renderDaysBefore() {
    // GET FIRST DAY OF MONTH
    const firstDayOfMonth = Calendar.calcFirstDayOfMonth(this.data.dates.current);
    // GET DAYS TO RENDER BEFORE THE FIRST DAY OF THE CURRENT MONTH
    this.data.daysToRenderBefore = (firstDayOfMonth > 0) ? firstDayOfMonth - 1 : 7 - 1;
    // GET THE MONTH BEFORE CURRENT MONTH
    const monthBefore = this.data.dates.current.getMonth() - 1 >= 0
      ? this.data.dates.current.getMonth() - 1
      : 11;
    // GET NUMBER OF DAYS TO FILL BEFORE CURRENT MONTH
    const daysInMonthBefore = monthBefore === 11
      ? Calendar.daysInMonth(this.data.dates.current.getFullYear() - 1, monthBefore)
      : Calendar.daysInMonth(this.data.dates.current.getFullYear() - 1, monthBefore);
    let gapBefore = daysInMonthBefore - this.data.daysToRenderBefore + 1;
    // RENDER ALL DAYS BEFORE
    for (gapBefore; gapBefore <= daysInMonthBefore; gapBefore++) {
      this.elements.days.appendChild(Calendar.createDayElement(gapBefore, ['disabled']));
    }
  }

  setDaysBetween() {
    const arrivalDate = this.data.dates.arrival ? this.data.dates.arrival : 0;
    const departDate = this.data.dates.depart ? this.data.dates.depart : 0;
    if (arrivalDate && departDate) {
      const daysBetween = Array.from(this.elements.days.querySelectorAll(DOM.day)).filter((day) => {
        if (!day.classList.contains('disabled')) {
          const dayDate = new Date(this.data.dates.current.getFullYear(),
            this.data.dates.current.getMonth(), day.getAttribute('data-day'));

          if (Number(dayDate) > Number(arrivalDate) && Number(dayDate) < Number(departDate)) {
            return day;
          }
        }
        return false;
      });
      daysBetween.forEach((day) => {
        day.classList.add('between');
      });
    }
  }

  renderCurrentDays() {
    this.data.daysToRender = Calendar.daysInMonth(
      this.data.dates.current.getFullYear(),
      this.data.dates.current.getMonth(),
    );
    const addCurrentDay = this.data.dates.current.getMonth() === this.data.dates.initial.getMonth()
            && this.data.dates.current.getFullYear() === this.data.dates.initial.getFullYear();
    for (let i = 1; i <= this.data.daysToRender; i++) {
      const renderedDate = new Date(
        this.data.dates.current.getFullYear(),
        this.data.dates.current.getMonth(),
        i,
      );
      const types = [];
      if (addCurrentDay && i === this.data.dates.initial.getDate()) {
        types.push('current');
      }
      if (Number(renderedDate) === Number(this.data.dates.arrival)) {
        types.push('arrival');
      }
      if (Number(renderedDate) === Number(this.data.dates.depart)) {
        types.push('depart');
      }
      if (Calendar.dateIsBetween(this.data.dates.arrival,
        this.data.dates.depart,
        renderedDate)) {
        types.push('between');
      }
      this.elements.days.appendChild(Calendar.createDayElement(i, types, true));
    }
  }

  renderDaysAfter() {
    let gapAfter = 42 - this.data.daysToRenderBefore - this.data.daysToRender;
    if (gapAfter >= 7) {
      gapAfter -= 7;
      if (gapAfter === 7) {
        gapAfter = 0;
      }
    }
    for (let i = 1; i <= gapAfter; i++) {
      this.elements.days.appendChild(Calendar.createDayElement(i, ['disabled']));
    }
  }

  clearDays() {
    this.elements.days.querySelectorAll('*').forEach((day) => day.remove());
  }

  clearDaysBetween(clearAll) {
    this.elements.days.querySelectorAll(DOM.day).forEach((day) => {
      if (day.classList.contains('between')) {
        day.classList.remove('between');
      }
      if (clearAll) {
        if (day.classList.contains('arrival') || day.classList.contains('depart')) {
          day.classList.remove('arrival', 'depart');
        }
      }
    });
  }

  clearData() {
    this.state = 'arrival';
    this.data.dates.arrival = '';
    this.data.dates.depart = '';
    this.data.daysBetween = '';
  }

  clearAll() {
    this.clearData();
    this.elements.arrival.input.textContent = this.elements.arrival.defaultText;
    if (this.elements.depart.input) {
      this.elements.depart.input.textContent = this.elements.depart.defaultText;
    }
    this.element.removeAttribute('data-arrival');
    this.element.removeAttribute('data-depart');
    this.clearDays();
    this.data.dates.current = new Date();
    this.renderAllDays();
  }

  changeFocus(type) {
    const changeTo = type === 'arrival' ? 'depart' : 'arrival';
    this.changeState(type === 'arrival' ? 'depart' : 'arrival');
    const from = this.elements[type].input;
    if (from) {
      from.classList.remove('active');
    }
    const to = this.elements[changeTo].input;
    if (to) {
      to.classList.add('active');
    }
  }
}

function noDot(string) {
  return string.replace('.', '');
}

function daysInMilliSeconds(ms) {
  return ms / 1000 / 60 / 60 / 24;
}
