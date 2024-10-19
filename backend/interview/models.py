import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.contrib.auth.hashers import make_password

def generate_userid(length=30):
    return str(uuid.uuid4())[:30]


class UserManager(BaseUserManager):
    def create_user(self,email, password=None,**extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        if not password:
            raise ValueError("The password field must be set")

        email = self.normalize_email(email)

        userid = generate_userid()
        user = self.model(email=email,userid=userid,**extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    def create_superuser(self, email, password=None,**extra_fields):
        user = self.create_user(
            email=email,
            # password=make_password(password),
            password=password,
            **extra_fields
        )
        user.is_admin = True
        user.is_superuser=True
        user.save(using=self._db)
        return user


class Users(AbstractBaseUser):
    userid = models.CharField(max_length=30, primary_key=True, editable=False)
    email = models.EmailField(max_length=50, unique=True)
    password = models.CharField(max_length=128)
    is_admin = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    

    last_login=None

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email
    
    def has_perm(self, perm, obj=None):
        "Does the user have a specific permission?"
        # Simplest possible answer: Yes, always
        return True

    def has_module_perms(self, app_label):
        "Does the user have permissions to view the app `app_label`?"
        # Simplest possible answer: Yes, always
        return True

    @property
    def is_staff(self):
        "Is the user a member of staff?"
        # Simplest possible answer: All admins are staff
        return self.is_admin or self.is_superuser

class Module(models.Model):
    moduleid=models.CharField(max_length=30, primary_key=True)
    modulename = models.CharField(max_length=30)
    prompt = models.TextField(max_length=1000)
    voice = models.CharField(max_length=50)
    system_prompt = models.TextField(max_length=1000)
    case_abstract = models.TextField(max_length=200)
    file = models.FileField(upload_to='attachments/', null=True, blank=True)
    model = models.CharField(max_length=50)

    def save(self, *args, **kwargs):
        if not self.moduleid:  # If module_id is not already set
            last_module = Module.objects.order_by('moduleid').last()  # Get the last module
            if last_module:
                last_id = last_module.moduleid  # Get the last module's ID
                number_part = int(last_id[1:]) + 1  # Increment the number part
            else:
                number_part = 1000
            
            # Format the new module_id
            self.moduleid = f'M{number_part:03}'
        super().save(*args,**kwargs)

    def __str__(self):
        return self.moduleid

class Admin(models.Model):
    adminid=models.CharField(max_length=30, primary_key=True, editable=False, default=generate_userid)
    userid = models.ForeignKey(Users, on_delete=models.CASCADE, null=True,blank=True)
    moduleid = models.ForeignKey(Module, on_delete=models.CASCADE, null=True, blank=True)
    email = models.EmailField(max_length=50)
    password = models.CharField(max_length=128)

    def __str__(self):
        return f"Admin: {self.adminid}"

class Interview(models.Model):
    interviewid = models.AutoField(primary_key=True)
    userid = models.ForeignKey(Users, on_delete=models.CASCADE)
    moduleid = models.ForeignKey(Module, on_delete=models.CASCADE)
    dateactive = models.DateTimeField()
    interviewlength = models.DurationField()
    transcript = models.TextField()
    timestamps = models.JSONField(default=list)
    def __str__(self):
        return f"Interview {self.interviewid}"
