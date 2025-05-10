# test.py
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

def run_test():
    local_test = False 
    if local_test:
        service = Service("D:\\Users\\nafisadman\\Downloads\\chromedriver-win64\\chromedriver-win64\\chromedriver.exe")
        driver = webdriver.Chrome(service=service)
    else: 
        options = Options()
        options.add_argument('--headless')  # Run in headless mode
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')

        driver = webdriver.Chrome(options=options)

    try:
        driver.get("http://localhost:3000")

        # Wait up to 10 seconds until the button is visible and clickable
        wait = WebDriverWait(driver, 10)
        button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[@component='SignInButton']")))
        button.click()

        # Wait for the email input field to appear
        email_input = wait.until(EC.visibility_of_element_located((By.ID, "identifier-field")))
        email_input.send_keys("fabib58744@harinv.com") 
        # Wait for and click the Continue button (using button text)
        continue_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[.//span[text()='Continue']]")))
        continue_button.click()

        # Wait for the password input field to appear
        email_input = wait.until(EC.visibility_of_element_located((By.ID, "password-field")))
        email_input.send_keys("90~?iSR6:vAw") 
        # Wait for and click the Continue button (using button text)
        continue_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[.//span[text()='Continue']]")))
        continue_button.click()

        """
        Button: Growth Tools 
        """
        # Item 1: Build Resume
        growth_tools_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[.//span[text()='Growth Tools']]")))
        growth_tools_button.click()
        build_resume = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[.//span[text()='Build Resume']]")))
        build_resume.click()
        time.sleep(10)
        
        # Item 2: Cover Letter
        growth_tools_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[.//span[text()='Growth Tools']]")))
        growth_tools_button.click()
        cover_letter = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[.//span[text()='Cover Letter']]")))
        cover_letter.click()
        time.sleep(10)

        # Item 3: Mock Interview
        growth_tools_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[.//span[text()='Growth Tools']]")))
        growth_tools_button.click()
        # mock_interview = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[.//span[text()='Mock Interview']]")))
        # mock_interview.click()

        time.sleep(10)
    finally:
        driver.quit()